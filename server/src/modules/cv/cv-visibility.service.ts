import { ForbiddenError } from '../../common/errors/ForbiddenError';
import { RequestUser } from '../../common/types/request-user.type';
import { isAdmin, isRecruiter } from '../../utils/permissions';
import { PositionsService } from '../positions/positions.service';

export class CvVisibilityService {
  constructor(private readonly positionsService: PositionsService) {}

  async ensureCanCreateCv(currentUser: RequestUser, positionId: string) {
    const position = await this.positionsService.getPositionById(positionId, currentUser);

    if (!position) {
      throw new ForbiddenError('Position is not accessible');
    }
  }

  async ensureCanViewCv(
    cv: {
      candidateProfile: { userId: string };
      status: string;
      positionId: string;
    },
    currentUser?: RequestUser
  ) {
    if (!currentUser) {
      throw new ForbiddenError('Authentication is required');
    }

    if (cv.candidateProfile.userId === currentUser.id) {
      return;
    }

    if (isAdmin(currentUser.roles)) {
      return;
    }

    if (isRecruiter(currentUser.roles)) {
      if (cv.status !== 'PUBLISHED') {
        throw new ForbiddenError('Recruiters can view only published CVs');
      }

      return;
    }

    throw new ForbiddenError('You do not have access to this CV');
  }

  async ensureCanEditCv(
    cv: {
      candidateProfile: { userId: string };
    },
    currentUser: RequestUser
  ) {
    if (cv.candidateProfile.userId === currentUser.id || isAdmin(currentUser.roles)) {
      return;
    }

    throw new ForbiddenError('You cannot edit this CV');
  }

  async ensureCanDeleteCv(
    cv: {
      candidateProfile: { userId: string };
    },
    currentUser: RequestUser
  ) {
    return this.ensureCanEditCv(cv, currentUser);
  }
}
