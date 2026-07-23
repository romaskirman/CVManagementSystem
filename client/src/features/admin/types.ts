import { UserRole } from '../../shared/api/admin.api';

export type AdminUserListItem = {
  id: string;
  email: string;
  displayName?: string | null;
  roles: UserRole[];
  isBlocked: boolean;
  hasCandidateProfile?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminUserDetails = {
  id: string;
  email: string;
  displayName?: string | null;
  roles: UserRole[];
  isBlocked: boolean;
  hasCandidateProfile?: boolean;
  createdAt: string;
  updatedAt: string;
  profileSummary?: {
    firstName?: string | null;
    lastName?: string | null;
    location?: string | null;
  } | null;
  stats?: {
    cvsCount: number;
    projectsCount: number;
    likesReceivedCount: number;
  } | null;
};
