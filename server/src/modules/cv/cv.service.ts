import { CvStatus, Prisma } from '@prisma/client';
import { ConflictError } from '../../common/errors/ConflictError';
import { NotFoundError } from '../../common/errors/NotFoundError';
import { ValidationError } from '../../common/errors/ValidationError';
import { RequestUser } from '../../common/types/request-user.type';
import { getPagination } from '../../utils/pagination';
import { isAdmin, isCandidate, isRecruiter } from '../../utils/permissions';
import { RecentAttributesService } from '../attributes/recent-attributes.service';
import { CvGenerationService } from './cv-generation.service';
import { CvRepository } from './cv.repository';
import { CvVisibilityService } from './cv-visibility.service';
import {
  CreateCvInput,
  ListCvsQuery,
  UpdateCvAttributeInput,
  UpdateCvProjectsInput
} from './cv.types';

type CvView = NonNullable<ReturnType<CvGenerationService['generateCvView']>>;
type CvListItem = Awaited<ReturnType<CvRepository['listCvs']>>['items'][number];
type CandidateProfileWithValues = NonNullable<
  Awaited<ReturnType<CvRepository['findCandidateProfileByUserId']>>
>;

function normalizeNullableString(value?: string | null) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export class CvService {
  constructor(
    private readonly cvRepository: CvRepository,
    private readonly cvGenerationService: CvGenerationService,
    private readonly cvVisibilityService: CvVisibilityService,
    private readonly recentAttributesService: RecentAttributesService
  ) {}

  async listCvs(query: ListCvsQuery, currentUser: RequestUser) {
    const pagination = getPagination(query);

    const result = await this.cvRepository.listCvs({
      skip: pagination.skip,
      take: pagination.take,
      status: query.status as CvStatus | undefined,
      positionId: query.positionId,
      candidateUserId: query.candidateUserId
    });

    const profile =
      isCandidate(currentUser.roles) && !isRecruiter(currentUser.roles) && !isAdmin(currentUser.roles)
        ? await this.cvRepository.findCandidateProfileByUserId(currentUser.id)
        : null;

    const visibleItems: Array<CvView & { hasPositionAccess: boolean }> = [];

    for (const cv of result.items) {
      try {
        await this.cvVisibilityService.ensureCanViewCv(
          {
            candidateProfile: { userId: cv.candidateProfile.userId },
            status: cv.status,
            positionId: cv.positionId
          },
          currentUser
        );

        const cvView = this.cvGenerationService.generateCvView(cv);

        if (!cvView) {
          continue;
        }

        const hasPositionAccess = profile
          ? this.hasCandidateAccessToPosition(cv, profile)
          : true;

        visibleItems.push({
          ...cvView,
          hasPositionAccess
        });
      } catch {
        continue;
      }
    }

    return {
      items: visibleItems,
      total: visibleItems.length,
      page: pagination.page,
      pageSize: pagination.pageSize
    };
  }

  async getCvById(cvId: string, currentUser: RequestUser) {
    const cv = await this.cvRepository.findCvById(cvId);

    if (!cv) {
      throw new NotFoundError('CV not found');
    }

    await this.cvVisibilityService.ensureCanViewCv(
      {
        candidateProfile: { userId: cv.candidateProfile.userId },
        status: cv.status,
        positionId: cv.positionId
      },
      currentUser
    );

    return this.cvGenerationService.generateCvView(cv);
  }

  async createCv(currentUser: RequestUser, input: CreateCvInput) {
    const profile = await this.cvRepository.findCandidateProfileByUserId(currentUser.id);

    if (!profile) {
      throw new NotFoundError('Candidate profile not found');
    }

    await this.cvVisibilityService.ensureCanCreateCv(currentUser, input.positionId);

    const existing = await this.cvRepository.findCvByCandidateProfileAndPosition(profile.id, input.positionId);

    if (existing) {
      throw new ConflictError('Candidate already has a CV for this position');
    }

    const created = await this.cvRepository.createCv(profile.id, input.positionId);
    const full = await this.cvRepository.findCvById(created.id);

    if (!full) {
      throw new NotFoundError('CV not found after creation');
    }

    return this.cvGenerationService.generateCvView(full);
  }

  async updateCvAttribute(cvId: string, currentUser: RequestUser, input: UpdateCvAttributeInput) {
    const cv = await this.cvRepository.findCvById(cvId);

    if (!cv) {
      throw new NotFoundError('CV not found');
    }

    await this.cvVisibilityService.ensureCanEditCv(
      {
        candidateProfile: { userId: cv.candidateProfile.userId }
      },
      currentUser
    );

    const positionAttribute = cv.position.attributes.find(
      (item) => item.attributeId === input.attributeId
    );

    if (!positionAttribute) {
      throw new ValidationError('Attribute is not part of position template');
    }

    const data: Prisma.ProfileAttributeValueUncheckedCreateInput = {
      profileId: cv.candidateProfileId,
      attributeId: input.attributeId,
      stringValue: normalizeNullableString(input.stringValue),
      textValue: normalizeNullableString(input.textValue),
      numberValue: typeof input.numberValue === 'number' ? new Prisma.Decimal(input.numberValue) : null,
      booleanValue: typeof input.booleanValue === 'boolean' ? input.booleanValue : null,
      dateValue: input.dateValue ? new Date(input.dateValue) : null,
      periodStart: input.periodStart ? new Date(input.periodStart) : null,
      periodEnd: input.periodEnd ? new Date(input.periodEnd) : null,
      imageUrl: normalizeNullableString(input.imageUrl),
      optionId: input.optionId ?? null
    };

    const updated = await this.cvRepository.upsertProfileAttributeValue({
      profileId: cv.candidateProfileId,
      attributeId: input.attributeId,
      data,
      version: input.version
    });

    if (!updated) {
      throw new ConflictError('CV attribute version conflict detected');
    }

    await this.recentAttributesService.markAsUsed(currentUser.id, input.attributeId);

    const refreshed = await this.cvRepository.findCvById(cvId);

    if (!refreshed) {
      throw new NotFoundError('CV not found after attribute update');
    }

    return this.cvGenerationService.generateCvView(refreshed);
  }

  async updateCvProjects(cvId: string, currentUser: RequestUser, input: UpdateCvProjectsInput) {
    const cv = await this.cvRepository.findCvById(cvId);

    if (!cv) {
      throw new NotFoundError('CV not found');
    }

    await this.cvVisibilityService.ensureCanEditCv(
      {
        candidateProfile: { userId: cv.candidateProfile.userId }
      },
      currentUser
    );

    if (input.projects.length > cv.position.maxProjects) {
      throw new ValidationError(`You can select at most ${cv.position.maxProjects} projects for this CV`);
    }

    const profileProjectIds = new Set(cv.candidateProfile.projects.map((project) => project.id));

    for (const item of input.projects) {
      if (!profileProjectIds.has(item.projectId)) {
        throw new ValidationError(`Project ${item.projectId} does not belong to candidate profile`);
      }
    }

    const normalizedProjects = input.projects.map((item, index) => ({
      projectId: item.projectId,
      sortOrder: typeof item.sortOrder === 'number' ? item.sortOrder : index
    }));

    const updated = await this.cvRepository.replaceCvProjects({
      cvId,
      version: input.version,
      projects: normalizedProjects
    });

    if (!updated) {
      throw new ConflictError('CV project selection version conflict detected');
    }

    const refreshed = await this.cvRepository.findCvById(cvId);

    if (!refreshed) {
      throw new NotFoundError('CV not found after projects update');
    }

    return this.cvGenerationService.generateCvView(refreshed);
  }

  async publishCv(cvId: string, currentUser: RequestUser) {
    const cv = await this.cvRepository.findCvById(cvId);

    if (!cv) {
      throw new NotFoundError('CV not found');
    }

    await this.cvVisibilityService.ensureCanEditCv(
      {
        candidateProfile: { userId: cv.candidateProfile.userId }
      },
      currentUser
    );

    const cvView = this.cvGenerationService.generateCvView(cv);
    this.cvGenerationService.ensureCanPublish(cvView);

    await this.cvRepository.updateCvStatus(cvId, CvStatus.PUBLISHED);

    const refreshed = await this.cvRepository.findCvById(cvId);

    if (!refreshed) {
      throw new NotFoundError('CV not found after publish');
    }

    return this.cvGenerationService.generateCvView(refreshed);
  }

  async unpublishCv(cvId: string, currentUser: RequestUser) {
    const cv = await this.cvRepository.findCvById(cvId);

    if (!cv) {
      throw new NotFoundError('CV not found');
    }

    await this.cvVisibilityService.ensureCanEditCv(
      {
        candidateProfile: { userId: cv.candidateProfile.userId }
      },
      currentUser
    );

    await this.cvRepository.updateCvStatus(cvId, CvStatus.DRAFT);

    const refreshed = await this.cvRepository.findCvById(cvId);

    if (!refreshed) {
      throw new NotFoundError('CV not found after unpublish');
    }

    return this.cvGenerationService.generateCvView(refreshed);
  }

  async deleteCv(cvId: string, currentUser: RequestUser) {
    const cv = await this.cvRepository.findCvById(cvId);

    if (!cv) {
      throw new NotFoundError('CV not found');
    }

    await this.cvVisibilityService.ensureCanDeleteCv(
      {
        candidateProfile: { userId: cv.candidateProfile.userId }
      },
      currentUser
    );

    await this.cvRepository.deleteCv(cvId);

    return {
      success: true
    };
  }

  private hasCandidateAccessToPosition(
    cv: Pick<CvListItem, 'position'>,
    profile: CandidateProfileWithValues
  ) {
    if (cv.position.visibilityMode === 'PUBLIC') {
      return true;
    }

    return cv.position.accessRules.every((rule) => {
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
}
