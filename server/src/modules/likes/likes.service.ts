import { ConflictError } from '../../common/errors/ConflictError';
import { ForbiddenError } from '../../common/errors/ForbiddenError';
import { NotFoundError } from '../../common/errors/NotFoundError';
import { RequestUser } from '../../common/types/request-user.type';
import { isRecruiter } from '../../utils/permissions';
import { CvRepository } from '../cv/cv.repository';
import { CvVisibilityService } from '../cv/cv-visibility.service';
import { LikesRepository } from './likes.repository';

export class LikesService {
  constructor(
    private readonly likesRepository: LikesRepository,
    private readonly cvRepository: CvRepository,
    private readonly cvVisibilityService: CvVisibilityService
  ) {}

  async likeCv(cvId: string, currentUser: RequestUser) {
    if (!isRecruiter(currentUser.roles)) {
      throw new ForbiddenError('Only recruiters can like CVs');
    }

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
      throw new ConflictError('Recruiter already liked this CV');
    }

    await this.likesRepository.createLike(cvId, currentUser.id);
    const likesCount = await this.likesRepository.countLikes(cvId);

    return {
      cvId,
      liked: true,
      likesCount
    };
  }

  async unlikeCv(cvId: string, currentUser: RequestUser) {
    if (!isRecruiter(currentUser.roles)) {
      throw new ForbiddenError('Only recruiters can unlike CVs');
    }

    const cv = await this.cvRepository.findCvById(cvId);

    if (!cv) {
      throw new NotFoundError('CV not found');
    }

    const existing = await this.likesRepository.findLike(cvId, currentUser.id);

    if (!existing) {
      throw new NotFoundError('Like not found');
    }

    await this.likesRepository.deleteLike(cvId, currentUser.id);
    const likesCount = await this.likesRepository.countLikes(cvId);

    return {
      cvId,
      liked: false,
      likesCount
    };
  }
}
