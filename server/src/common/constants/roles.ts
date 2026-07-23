export const ROLES = {
  CANDIDATE: 'CANDIDATE',
  RECRUITER: 'RECRUITER',
  ADMIN: 'ADMIN'
} as const;

export type RoleCodeValue = (typeof ROLES)[keyof typeof ROLES];
