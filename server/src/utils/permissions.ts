import { ForbiddenError } from '../common/errors/ForbiddenError';
import { ROLES } from '../common/constants/roles';

export function hasRole(userRoles: string[], role: string): boolean {
  return userRoles.includes(role);
}

export function isAdmin(userRoles: string[]): boolean {
  return hasRole(userRoles, 'ADMIN');
}

export function isRecruiter(userRoles: string[]): boolean {
  return hasRole(userRoles, 'RECRUITER');
}

export function isCandidate(userRoles: string[]): boolean {
  return hasRole(userRoles, 'CANDIDATE');
}

export function ensureOwnerOrAdmin(
  currentUserId: string,
  resourceOwnerId: string,
  userRoles: string[]
): void {
  if (currentUserId === resourceOwnerId || isAdmin(userRoles)) {
    return;
  }

  throw new ForbiddenError('You do not have access to this resource');
}

export function ensureAdmin(userRoles: string[]): void {
  if (!isAdmin(userRoles)) {
    throw new ForbiddenError('Administrator permissions are required');
  }
}

export function ensureRecruiterOrAdmin(userRoles: string[]): void {
  if (isRecruiter(userRoles) || isAdmin(userRoles)) {
    return;
  }

  throw new ForbiddenError('Recruiter or administrator permissions are required');
}

export { ROLES };
