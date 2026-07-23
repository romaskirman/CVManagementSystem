import { CvStatus, Prisma } from '@prisma/client';
import { ConflictError } from '../../common/errors/ConflictError';
import { NotFoundError } from '../../common/errors/NotFoundError';
import { ValidationError } from '../../common/errors/ValidationError';
import { RequestUser } from '../../common/types/request-user.type';
import { getPagination } from '../../utils/pagination';
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

    const visibleItems: CvView[] = [];

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

        if (cvView) {
          visibleItems.push(cvView);
        }
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
}
