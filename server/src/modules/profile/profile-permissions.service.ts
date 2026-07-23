import { ForbiddenError } from '../../common/errors/ForbiddenError';
import { isAdmin } from '../../utils/permissions';

export class ProfilePermissionsService {
  ensureCanViewFullProfile(params: {
    currentUserId: string;
    targetUserId: string;
    currentUserRoles: string[];
  }) {
    if (params.currentUserId === params.targetUserId || isAdmin(params.currentUserRoles)) {
      return;
    }

    throw new ForbiddenError('You cannot access this profile');
  }

  ensureCanEditFullProfile(params: {
    currentUserId: string;
    targetUserId: string;
    currentUserRoles: string[];
  }) {
    if (params.currentUserId === params.targetUserId || isAdmin(params.currentUserRoles)) {
      return;
    }

    throw new ForbiddenError('You cannot edit this profile');
  }
}
