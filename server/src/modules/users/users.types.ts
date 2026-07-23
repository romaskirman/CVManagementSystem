export interface UsersQuery {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface UpdateRolesInput {
  roles: Array<'CANDIDATE' | 'RECRUITER' | 'ADMIN'>;
}
