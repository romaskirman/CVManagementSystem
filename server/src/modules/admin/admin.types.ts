export type AdminRoleCode = 'CANDIDATE' | 'RECRUITER' | 'ADMIN';

export interface AdminUsersQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  isBlocked?: boolean;
  role?: AdminRoleCode;
}

export interface CreateUserInput {
  email: string;
  password: string;
  roleCode: AdminRoleCode;
}

export interface AssignRoleInput {
  roleCode: AdminRoleCode;
}

export interface RemoveRoleInput {
  roleCode: AdminRoleCode;
}
