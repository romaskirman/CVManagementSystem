import { Prisma } from '@prisma/client';
import { NotFoundError } from '../../common/errors/NotFoundError';
import { ValidationError } from '../../common/errors/ValidationError';
import { mapPrismaError } from '../../utils/prisma-errors';
import { RecentAttributesService } from '../attributes/recent-attributes.service';
import { ProfileRepository } from './profile.repository';
import { ProfilePermissionsService } from './profile-permissions.service';
import { ProfileAutosaveService } from './profile-autosave.service';
import { ProfileAttributeValueInput, UpdateProfileInput } from './profile.types';

export class ProfileService {
  constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly permissionsService: ProfilePermissionsService,
    private readonly autosaveService: ProfileAutosaveService,
    private readonly recentAttributesService: RecentAttributesService
  ) {}

  async getMyProfile(currentUserId: string) {
    const profile = await this.profileRepository.findProfileByUserId(currentUserId);

    if (!profile) {
      throw new NotFoundError('Profile not found');
    }

    return this.mapProfile(profile);
  }

  async getPublicProfile(targetUserId: string, currentUserId: string, currentUserRoles: string[]) {
    this.permissionsService.ensureCanViewFullProfile({
      currentUserId,
      targetUserId,
      currentUserRoles
    });

    const profile = await this.profileRepository.findProfileByUserId(targetUserId);

    if (!profile) {
      throw new NotFoundError('Profile not found');
    }

    return this.mapProfile(profile);
  }

  async updateMyProfile(currentUserId: string, input: UpdateProfileInput) {
    const profile = await this.profileRepository.findProfileByUserId(currentUserId);

    if (!profile) {
      throw new NotFoundError('Profile not found');
    }

    const profileVersionUpdate = await this.profileRepository.updateProfileVersion(profile.id, input.version);
    this.autosaveService.ensureProfileVersionUpdateSucceeded(profileVersionUpdate.count);

    for (const attributeInput of input.attributes) {
      await this.upsertProfileAttributeInternal(profile.id, currentUserId, attributeInput);
    }

    const updatedProfile = await this.profileRepository.findProfileById(profile.id);

    if (!updatedProfile) {
      throw new NotFoundError('Profile not found after update');
    }

    return this.mapProfile(updatedProfile);
  }

  async upsertMyProfileAttribute(currentUserId: string, input: ProfileAttributeValueInput) {
    const profile = await this.profileRepository.findProfileByUserId(currentUserId);

    if (!profile) {
      throw new NotFoundError('Profile not found');
    }

    await this.upsertProfileAttributeInternal(profile.id, currentUserId, input);

    const updatedProfile = await this.profileRepository.findProfileById(profile.id);

    if (!updatedProfile) {
      throw new NotFoundError('Profile not found after attribute update');
    }

    return this.mapProfile(updatedProfile);
  }

  async deleteMyProfileAttribute(currentUserId: string, attributeId: string) {
    const profile = await this.profileRepository.findProfileByUserId(currentUserId);

    if (!profile) {
      throw new NotFoundError('Profile not found');
    }

    const attribute = await this.profileRepository.findAttributeDefinitionById(attributeId);

    if (!attribute) {
      throw new NotFoundError('Attribute not found');
    }

    if (attribute.isBuiltIn) {
      throw new ValidationError('Built-in attributes cannot be removed');
    }

    await this.profileRepository.deleteAttributeValue(profile.id, attributeId);

    const updatedProfile = await this.profileRepository.findProfileById(profile.id);

    if (!updatedProfile) {
      throw new NotFoundError('Profile not found after attribute deletion');
    }

    return this.mapProfile(updatedProfile);
  }

  private async upsertProfileAttributeInternal(
    profileId: string,
    currentUserId: string,
    input: ProfileAttributeValueInput
  ) {
    const attribute = await this.profileRepository.findAttributeDefinitionById(input.attributeId);

    if (!attribute) {
      throw new NotFoundError('Attribute not found');
    }

    this.validateAttributePayload(attribute.type, input, Boolean(attribute.options.length));

    const data: Prisma.ProfileAttributeValueUncheckedCreateInput = {
      profileId,
      attributeId: input.attributeId,
      stringValue: input.stringValue ?? null,
      textValue: input.textValue ?? null,
      numberValue: typeof input.numberValue === 'number' ? new Prisma.Decimal(input.numberValue) : null,
      booleanValue: typeof input.booleanValue === 'boolean' ? input.booleanValue : null,
      dateValue: input.dateValue ? new Date(input.dateValue) : null,
      periodStart: input.periodStart ? new Date(input.periodStart) : null,
      periodEnd: input.periodEnd ? new Date(input.periodEnd) : null,
      imageUrl: input.imageUrl ?? null,
      optionId: input.optionId ?? null
    };

    try {
      const result = await this.profileRepository.upsertAttributeValue({
        profileId,
        attributeId: input.attributeId,
        data,
        version: input.version
      });

      this.autosaveService.ensureAttributeVersionUpdateSucceeded(result);
      await this.recentAttributesService.markAsUsed(currentUserId, input.attributeId);
      return result;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        mapPrismaError(error);
      }

      throw error;
    }
  }

  private validateAttributePayload(
    attributeType: string,
    input: ProfileAttributeValueInput,
    hasOptions: boolean
  ) {
    if (attributeType === 'ONE_OF_MANY' && hasOptions && !input.optionId && input.optionId !== null) {
      throw new ValidationError('Dropdown attribute requires optionId');
    }

    if (attributeType === 'IMAGE' && input.imageUrl && !input.imageUrl.startsWith('http')) {
      throw new ValidationError('Image attribute requires external URL');
    }

    if (attributeType === 'PERIOD' && input.periodStart && input.periodEnd) {
      if (new Date(input.periodStart) > new Date(input.periodEnd)) {
        throw new ValidationError('Period start cannot be greater than period end');
      }
    }
  }

  private mapProfile(profile: Awaited<ReturnType<ProfileRepository['findProfileById']>>) {
    if (!profile) {
      return null;
    }

    return {
      id: profile.id,
      version: profile.version,
      user: {
        id: profile.user.id,
        email: profile.user.email,
        isBlocked: profile.user.isBlocked,
        roles: profile.user.roles.map((item) => item.role.code)
      },
      attributes: profile.attributeValues.map((value) => ({
        id: value.id,
        version: value.version,
        attributeId: value.attributeId,
        attributeName: value.attribute.name,
        attributeType: value.attribute.type,
        category: value.attribute.category,
        isBuiltIn: value.attribute.isBuiltIn,
        stringValue: value.stringValue,
        textValue: value.textValue,
        numberValue: value.numberValue ? Number(value.numberValue) : null,
        booleanValue: value.booleanValue,
        dateValue: value.dateValue,
        periodStart: value.periodStart,
        periodEnd: value.periodEnd,
        imageUrl: value.imageUrl,
        optionId: value.optionId,
        optionLabel: value.option?.label ?? null
      })),
      projects: profile.projects.map((project) => ({
        id: project.id,
        name: project.name,
        periodStart: project.periodStart,
        periodEnd: project.periodEnd,
        descriptionMarkdown: project.descriptionMarkdown,
        version: project.version,
        tags: project.tagLinks.map((link) => ({
          id: link.tag.id,
          name: link.tag.name
        }))
      })),
      cvs: profile.cvs.map((cv) => ({
        id: cv.id,
        positionId: cv.positionId,
        positionTitle: cv.position.title,
        status: cv.status,
        likesCount: cv.likes.length,
        updatedAt: cv.updatedAt
      })),
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt
    };
  }
}
