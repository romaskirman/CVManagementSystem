import { NotFoundError } from '../../common/errors/NotFoundError';
import { RequestUser } from '../../common/types/request-user.type';
import { ensureRecruiterOrAdmin } from '../../utils/permissions';
import { CvRepository } from '../cv/cv.repository';
import { CvVisibilityService } from '../cv/cv-visibility.service';
import { LikesRepository } from './likes.repository';

export class LikesService {
  constructor(
    private readonly likesRepository: LikesRepository,
    private readonly cvRepository: CvRepository,
    private readonly cvVisibilityService: CvVisibilityService
  ) {}

  async getCvLikeState(cvId: string, currentUser: RequestUser) {
    ensureRecruiterOrAdmin(currentUser.roles);

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

    const existing = await this.likesRepository.findLike(cvId, currentUser.id);
    const likesCount = await this.likesRepository.countLikes(cvId);

    return {
      cvId,
      likedByMe: Boolean(existing),
      likesCount
    };
  }

  async likeCv(cvId: string, currentUser: RequestUser) {
    ensureRecruiterOrAdmin(currentUser.roles);

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

    const existing = await this.likesRepository.findLike(cvId, currentUser.id);

    if (!existing) {
      await this.likesRepository.createLike(cvId, currentUser.id);
    }

    const likesCount = await this.likesRepository.countLikes(cvId);

    return {
      cvId,
      likedByMe: true,
      likesCount
    };
  }

  async unlikeCv(cvId: string, currentUser: RequestUser) {
    ensureRecruiterOrAdmin(currentUser.roles);

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

    const existing = await this.likesRepository.findLike(cvId, currentUser.id);

    if (existing) {
      await this.likesRepository.deleteLike(cvId, currentUser.id);
    }

    const likesCount = await this.likesRepository.countLikes(cvId);

    return {
      cvId,
      likedByMe: false,
      likesCount
    };
  }
}
