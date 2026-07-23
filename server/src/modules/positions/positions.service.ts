import { PositionLevel, PositionVisibilityMode, Prisma, RuleOperator } from '@prisma/client';
import { ConflictError } from '../../common/errors/ConflictError';
import { ForbiddenError } from '../../common/errors/ForbiddenError';
import { NotFoundError } from '../../common/errors/NotFoundError';
import { ValidationError } from '../../common/errors/ValidationError';
import { getPagination } from '../../utils/pagination';
import { isAdmin, isRecruiter } from '../../utils/permissions';
import { RequestUser } from '../../common/types/request-user.type';
import { PositionAccessRulesService } from './position-access-rules.service';
import { CreatePositionInput, PositionsQuery, UpdatePositionInput } from './positions.types';
import { PositionsRepository } from './positions.repository';

export class PositionsService {
  constructor(
    private readonly positionsRepository: PositionsRepository,
    private readonly positionAccessRulesService: PositionAccessRulesService
  ) {}

  async listPositions(query: PositionsQuery, currentUser?: RequestUser) {
    const pagination = getPagination(query);

    const result = await this.positionsRepository.findPositions({
      skip: pagination.skip,
      take: pagination.take,
      search: query.search,
      visibilityMode: query.visibilityMode as PositionVisibilityMode | undefined,
      company: query.company,
      level: query.level as PositionLevel | undefined
    });

    let items = result.items;

    if (query.accessibleOnly && currentUser) {
      items = await this.filterAccessiblePositions(items, currentUser.id);
    }

    if (!currentUser) {
      items = items.filter((item) => item.visibilityMode === 'PUBLIC');
    }

    return {
      items: items.map((item) => this.mapPosition(item)),
      total: query.accessibleOnly || !currentUser ? items.length : result.total,
      page: pagination.page,
      pageSize: pagination.pageSize
    };
  }

  async getPositionById(positionId: string, currentUser?: RequestUser) {
    const position = await this.positionsRepository.findPositionById(positionId);

    if (!position) {
      throw new NotFoundError('Position not found');
    }

    if (!currentUser && position.visibilityMode !== 'PUBLIC') {
      throw new ForbiddenError('This position is not public');
    }

    if (currentUser && position.visibilityMode === 'RESTRICTED') {
      const canAccess =
        isRecruiter(currentUser.roles) ||
        isAdmin(currentUser.roles) ||
        (await this.isPositionAccessibleToCandidate(position, currentUser.id));

      if (!canAccess) {
        throw new ForbiddenError('You do not have access to this position');
      }
    }

    return this.mapPosition(position);
  }

  async createPosition(input: CreatePositionInput, currentUser: RequestUser) {
    this.ensureCanManagePositions(currentUser.roles);
    await this.validatePositionInput(input);

    const created = await this.positionsRepository.createPosition({
      title: input.title,
      shortDescription: input.shortDescription,
      visibilityMode: input.visibilityMode as PositionVisibilityMode,
      company: input.company ?? null,
      level: input.level ? (input.level as PositionLevel) : null,
      maxProjects: input.maxProjects,
      createdById: currentUser.id,
      updatedById: currentUser.id
    });

    await this.syncRelations(created.id, input);

    const full = await this.positionsRepository.findPositionById(created.id);

    if (!full) {
      throw new NotFoundError('Position not found after creation');
    }

    return this.mapPosition(full);
  }

  async updatePosition(positionId: string, input: UpdatePositionInput, currentUser: RequestUser) {
    this.ensureCanManagePositions(currentUser.roles);
    await this.validatePositionInput(input);

    const existing = await this.positionsRepository.findPositionById(positionId);

    if (!existing) {
      throw new NotFoundError('Position not found');
    }

    const updated = await this.positionsRepository.updatePosition(positionId, input.version, {
      title: input.title,
      shortDescription: input.shortDescription,
      visibilityMode: input.visibilityMode as PositionVisibilityMode,
      company: input.company ?? null,
      level: input.level ? (input.level as PositionLevel) : null,
      maxProjects: input.maxProjects,
      updatedById: currentUser.id
    });

    if (!updated) {
      throw new ConflictError('Position version conflict detected');
    }

    await this.syncRelations(positionId, input);

    const full = await this.positionsRepository.findPositionById(positionId);

    if (!full) {
      throw new NotFoundError('Position not found after update');
    }

    return this.mapPosition(full);
  }

  async deletePosition(positionId: string, currentUser: RequestUser) {
    this.ensureCanManagePositions(currentUser.roles);

    const existing = await this.positionsRepository.findPositionById(positionId);

    if (!existing) {
      throw new NotFoundError('Position not found');
    }

    await this.positionsRepository.deletePosition(positionId);

    return {
      success: true
    };
  }

  async duplicatePosition(positionId: string, currentUser: RequestUser) {
    this.ensureCanManagePositions(currentUser.roles);

    const existing = await this.positionsRepository.findPositionById(positionId);

    if (!existing) {
      throw new NotFoundError('Position not found');
    }

    const duplicated = await this.positionsRepository.duplicatePosition(existing, currentUser.id);

    if (!duplicated) {
      throw new NotFoundError('Failed to duplicate position');
    }

    const full = await this.positionsRepository.findPositionById(duplicated.id);

    if (!full) {
      throw new NotFoundError('Duplicated position not found');
    }

    return this.mapPosition(full);
  }

  private ensureCanManagePositions(userRoles: string[]) {
    if (isRecruiter(userRoles) || isAdmin(userRoles)) {
      return;
    }

    throw new ForbiddenError('Only recruiters or administrators can manage positions');
  }

  private async validatePositionInput(input: CreatePositionInput | UpdatePositionInput) {
    const uniqueAttributeIds = new Set(input.attributes.map((item) => item.attributeId));

    if (uniqueAttributeIds.size !== input.attributes.length) {
      throw new ValidationError('Position attributes must be unique');
    }

    for (const attributeInput of input.attributes) {
      const attribute = await this.positionsRepository.findAttributeById(attributeInput.attributeId);

      if (!attribute) {
        throw new NotFoundError(`Attribute ${attributeInput.attributeId} not found`);
      }
    }

    if (input.visibilityMode === 'PUBLIC' && input.accessRules.length > 0) {
      throw new ValidationError('Public positions cannot contain access rules');
    }

    if (input.visibilityMode === 'RESTRICTED' && input.accessRules.length === 0) {
      throw new ValidationError('Restricted positions must contain at least one access rule');
    }

    for (const rule of input.accessRules) {
      const attribute = await this.positionsRepository.findAttributeById(rule.attributeId);

      if (!attribute) {
        throw new NotFoundError(`Access rule attribute ${rule.attributeId} not found`);
      }

      this.positionAccessRulesService.validateRule(attribute.type, rule);

      if (rule.optionId && !attribute.options.some((option) => option.id === rule.optionId)) {
        throw new ValidationError('Access rule optionId does not belong to attribute');
      }
    }
  }

  private async syncRelations(positionId: string, input: CreatePositionInput | UpdatePositionInput) {
    await this.positionsRepository.replacePositionAttributes(
      positionId,
      input.attributes.map((item, index) => ({
        attributeId: item.attributeId,
        sortOrder: typeof item.sortOrder === 'number' ? item.sortOrder : index,
        isRequired: item.isRequired
      }))
    );

    await this.positionsRepository.replaceAccessRules(
      positionId,
      input.accessRules.map((rule, index) => ({
        attributeId: rule.attributeId,
        operator: rule.operator as RuleOperator,
        stringValue: rule.stringValue ?? null,
        numberValue: typeof rule.numberValue === 'number' ? new Prisma.Decimal(rule.numberValue) : null,
        booleanValue: typeof rule.booleanValue === 'boolean' ? rule.booleanValue : null,
        dateValue: rule.dateValue ? new Date(rule.dateValue) : null,
        secondDateValue: rule.secondDateValue ? new Date(rule.secondDateValue) : null,
        optionId: rule.optionId ?? null,
        sortOrder: typeof rule.sortOrder === 'number' ? rule.sortOrder : index
      }))
    );

    const tagIds: string[] = [];

    for (const rawName of input.projectTags) {
      const tag = await this.positionsRepository.upsertTagByName(rawName.trim());
      tagIds.push(tag.id);
    }

    await this.positionsRepository.replaceProjectTags(positionId, [...new Set(tagIds)]);
  }

  private async filterAccessiblePositions(
    positions: Awaited<ReturnType<PositionsRepository['findPositions']>>['items'],
    userId: string
  ) {
    const accessible = [];

    for (const position of positions) {
      const canAccess = await this.isPositionAccessibleToCandidate(position, userId);

      if (canAccess) {
        accessible.push(position);
      }
    }

    return accessible;
  }

  private async isPositionAccessibleToCandidate(
    position: Awaited<ReturnType<PositionsRepository['findPositionById']>>,
    userId: string
  ) {
    if (!position) {
      return false;
    }

    if (position.visibilityMode === 'PUBLIC') {
      return true;
    }

    const profile = await this.positionsRepository.findProfileByUserId(userId);

    if (!profile) {
      return false;
    }

    return position.accessRules.every((rule) => {
      const value = profile.attributeValues.find((item) => item.attributeId === rule.attributeId);

      if (!value) {
        return false;
      }

      switch (rule.operator) {
        case 'EQUALS':
          if (rule.optionId) {
            return value.optionId === rule.optionId;
          }
          if (rule.stringValue !== null) {
            return value.stringValue === rule.stringValue || value.textValue === rule.stringValue;
          }
          if (rule.numberValue !== null) {
            return Number(value.numberValue) === Number(rule.numberValue);
          }
          if (typeof rule.booleanValue === 'boolean') {
            return value.booleanValue === rule.booleanValue;
          }
          if (rule.dateValue) {
            return value.dateValue?.toISOString() === rule.dateValue.toISOString();
          }
          return false;

        case 'NOT_EQUALS':
          if (rule.optionId) {
            return value.optionId !== rule.optionId;
          }
          if (rule.stringValue !== null) {
            return value.stringValue !== rule.stringValue && value.textValue !== rule.stringValue;
          }
          if (rule.numberValue !== null) {
            return Number(value.numberValue) !== Number(rule.numberValue);
          }
          if (typeof rule.booleanValue === 'boolean') {
            return value.booleanValue !== rule.booleanValue;
          }
          return true;

        case 'CONTAINS':
          return Boolean(
            value.stringValue?.toLowerCase().includes((rule.stringValue ?? '').toLowerCase()) ||
              value.textValue?.toLowerCase().includes((rule.stringValue ?? '').toLowerCase())
          );

        case 'STARTS_WITH':
          return Boolean(
            value.stringValue?.toLowerCase().startsWith((rule.stringValue ?? '').toLowerCase()) ||
              value.textValue?.toLowerCase().startsWith((rule.stringValue ?? '').toLowerCase())
          );

        case 'GREATER_THAN':
          return Number(value.numberValue) > Number(rule.numberValue);

        case 'GREATER_THAN_OR_EQUAL':
          return Number(value.numberValue) >= Number(rule.numberValue);

        case 'LESS_THAN':
          return Number(value.numberValue) < Number(rule.numberValue);

        case 'LESS_THAN_OR_EQUAL':
          return Number(value.numberValue) <= Number(rule.numberValue);

        case 'IS_TRUE':
          return value.booleanValue === true;

        case 'IS_FALSE':
          return value.booleanValue === false;

        case 'BEFORE':
          return Boolean(value.dateValue && rule.dateValue && value.dateValue < rule.dateValue);

        case 'AFTER':
          return Boolean(value.dateValue && rule.dateValue && value.dateValue > rule.dateValue);

        case 'ON':
          return Boolean(
            value.dateValue &&
              rule.dateValue &&
              value.dateValue.toISOString().slice(0, 10) === rule.dateValue.toISOString().slice(0, 10)
          );

        case 'OVERLAPS':
          return Boolean(
            value.periodStart &&
              value.periodEnd &&
              rule.dateValue &&
              rule.secondDateValue &&
              value.periodStart <= rule.secondDateValue &&
              value.periodEnd >= rule.dateValue
          );

        case 'IN_SET':
          return Boolean(rule.optionId && value.optionId === rule.optionId);

        default:
          return false;
      }
    });
  }

  private mapPosition(position: Awaited<ReturnType<PositionsRepository['findPositionById']>>) {
    if (!position) {
      return null;
    }

    return {
      id: position.id,
      title: position.title,
      shortDescription: position.shortDescription,
      visibilityMode: position.visibilityMode,
      company: position.company,
      level: position.level,
      maxProjects: position.maxProjects,
      version: position.version,
      attributes: position.attributes.map((item) => ({
        id: item.id,
        attributeId: item.attributeId,
        sortOrder: item.sortOrder,
        isRequired: item.isRequired,
        attribute: {
          id: item.attribute.id,
          name: item.attribute.name,
          category: item.attribute.category,
          type: item.attribute.type,
          options: item.attribute.options.map((option) => ({
            id: option.id,
            label: option.label,
            sortOrder: option.sortOrder
          }))
        }
      })),
      accessRules: position.accessRules.map((rule) => ({
        id: rule.id,
        attributeId: rule.attributeId,
        attributeName: rule.attribute.name,
        operator: rule.operator,
        stringValue: rule.stringValue,
        numberValue: rule.numberValue ? Number(rule.numberValue) : null,
        booleanValue: rule.booleanValue,
        dateValue: rule.dateValue,
        secondDateValue: rule.secondDateValue,
        optionId: rule.optionId,
        optionLabel: rule.option?.label ?? null,
        sortOrder: rule.sortOrder
      })),
      projectTags: position.projectTags.map((link) => ({
        id: link.tag.id,
        name: link.tag.name
      })),
      submittedCvCount: position.cvs.length,
      createdAt: position.createdAt,
      updatedAt: position.updatedAt
    };
  }
}
