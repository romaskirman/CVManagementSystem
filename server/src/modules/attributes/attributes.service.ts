import { AttributeCategory, AttributeType, Prisma } from '@prisma/client';
import { ConflictError } from '../../common/errors/ConflictError';
import { ForbiddenError } from '../../common/errors/ForbiddenError';
import { NotFoundError } from '../../common/errors/NotFoundError';
import { ValidationError } from '../../common/errors/ValidationError';
import { getPagination } from '../../utils/pagination';
import { isAdmin, isRecruiter } from '../../utils/permissions';
import { mapPrismaError } from '../../utils/prisma-errors';
import { RequestUser } from '../../common/types/request-user.type';
import { AttributesRepository } from './attributes.repository';
import { AttributesQuery, CreateAttributeInput, UpdateAttributeInput } from './attributes.types';

export class AttributesService {
  constructor(private readonly attributesRepository: AttributesRepository) {}

  async listAttributes(query: AttributesQuery, currentUserId?: string) {
    const pagination = getPagination(query);

    const result = await this.attributesRepository.findAttributes({
      skip: pagination.skip,
      take: pagination.take,
      search: query.search,
      prefix: query.prefix,
      category: query.category as AttributeCategory | undefined,
      type: query.type as AttributeType | undefined,
      recentlyUsedOnly: query.recentlyUsedOnly,
      userId: currentUserId
    });

    return {
      items: result.items.map((attribute) => this.mapAttribute(attribute, currentUserId)),
      total: result.total,
      page: pagination.page,
      pageSize: pagination.pageSize
    };
  }

  async getAttributeById(attributeId: string, currentUserId?: string) {
    const attribute = await this.attributesRepository.findAttributeById(attributeId);

    if (!attribute) {
      throw new NotFoundError('Attribute not found');
    }

    return this.mapAttribute(attribute, currentUserId);
  }

  async createAttribute(input: CreateAttributeInput, currentUser: RequestUser) {
    this.ensureCanManageLibrary(currentUser.roles);
    this.validateAttributeInput(input);

    const existing = await this.attributesRepository.findAttributeByName(input.name);

    if (existing) {
      throw new ConflictError('Attribute name must be globally unique');
    }

    try {
      const created = await this.attributesRepository.createAttribute({
        category: input.category as AttributeCategory,
        name: input.name,
        description: input.description,
        type: input.type as AttributeType,
        createdById: currentUser.id,
        options: this.normalizeOptions(input.options)
      });

      return this.mapAttribute(created, currentUser.id);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        mapPrismaError(error);
      }

      throw error;
    }
  }

  async updateAttribute(attributeId: string, input: UpdateAttributeInput, currentUser: RequestUser) {
    this.ensureCanManageLibrary(currentUser.roles);
    this.validateAttributeInput(input);

    const existing = await this.attributesRepository.findAttributeById(attributeId);

    if (!existing) {
      throw new NotFoundError('Attribute not found');
    }

    if (existing.isBuiltIn && existing.type !== input.type) {
      throw new ValidationError('Built-in attribute type cannot be changed');
    }

    const attributeWithSameName = await this.attributesRepository.findAttributeByName(input.name);

    if (attributeWithSameName && attributeWithSameName.id !== attributeId) {
      throw new ConflictError('Attribute name must be globally unique');
    }

    try {
      const updated = await this.attributesRepository.updateAttribute(attributeId, {
        category: input.category as AttributeCategory,
        name: input.name,
        description: input.description,
        type: input.type as AttributeType,
        options: this.normalizeOptions(input.options)
      });

      return this.mapAttribute(updated, currentUser.id);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        mapPrismaError(error);
      }

      throw error;
    }
  }

  async deleteAttribute(attributeId: string, currentUser: RequestUser) {
    this.ensureCanManageLibrary(currentUser.roles);

    const existing = await this.attributesRepository.findAttributeById(attributeId);

    if (!existing) {
      throw new NotFoundError('Attribute not found');
    }

    if (existing.isBuiltIn || !existing.isDeletable) {
      throw new ValidationError('This attribute cannot be deleted');
    }

    await this.attributesRepository.deleteAttribute(attributeId);

    return {
      success: true
    };
  }

  async markAsUsed(userId: string, attributeId: string) {
    const existing = await this.attributesRepository.findAttributeById(attributeId);

    if (!existing) {
      throw new NotFoundError('Attribute not found');
    }

    await this.attributesRepository.markAttributeAsRecentlyUsed(userId, attributeId);

    return {
      success: true
    };
  }

  private ensureCanManageLibrary(userRoles: string[]) {
    if (isRecruiter(userRoles) || isAdmin(userRoles)) {
      return;
    }

    throw new ForbiddenError('Only recruiters or administrators can manage attribute library');
  }

  private validateAttributeInput(input: CreateAttributeInput | UpdateAttributeInput) {
    if (input.type === 'ONE_OF_MANY' && input.options.length === 0) {
      throw new ValidationError('Dropdown attribute must contain at least one option');
    }

    if (input.type !== 'ONE_OF_MANY' && input.options.length > 0) {
      throw new ValidationError('Only dropdown attributes may contain options');
    }

    const normalizedLabels = input.options.map((item) => item.label.trim().toLowerCase());
    const uniqueLabels = new Set(normalizedLabels);

    if (uniqueLabels.size !== normalizedLabels.length) {
      throw new ValidationError('Dropdown options must be unique');
    }
  }

  private normalizeOptions(options: Array<{ label: string; sortOrder?: number }>) {
    return options.map((option, index) => ({
      label: option.label.trim(),
      sortOrder: typeof option.sortOrder === 'number' ? option.sortOrder : index
    }));
  }

  private mapAttribute(
    attribute: Awaited<ReturnType<AttributesRepository['findAttributeById']>>,
    currentUserId?: string
  ) {
    if (!attribute) {
      return null;
    }

    const withMeta = attribute as typeof attribute & {
      _count?: {
        profileValues: number;
        positionAttributes: number;
        accessRules: number;
      };
      recentUsages?: Array<{ userId: string; attributeId: string; lastUsedAt: Date }>;
    };

    return {
      id: attribute.id,
      category: attribute.category,
      name: attribute.name,
      description: attribute.description,
      type: attribute.type,
      isBuiltIn: attribute.isBuiltIn,
      isDeletable: attribute.isDeletable,
      createdById: attribute.createdById,
      options: attribute.options.map((option) => ({
        id: option.id,
        label: option.label,
        sortOrder: option.sortOrder
      })),
      usage: withMeta._count
        ? {
            profileValues: withMeta._count.profileValues,
            positionAttributes: withMeta._count.positionAttributes,
            accessRules: withMeta._count.accessRules
          }
        : null,
      recentlyUsedAt:
        currentUserId && withMeta.recentUsages && withMeta.recentUsages.length > 0
          ? withMeta.recentUsages[0].lastUsedAt
          : null,
      createdAt: attribute.createdAt,
      updatedAt: attribute.updatedAt
    };
  }
}
