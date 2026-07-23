import { http } from './http';

export type UserRole = 'CANDIDATE' | 'RECRUITER' | 'ADMIN';

export type AdminUsersListResponse = {
  items: Array<{
    id: string;
    email: string;
    displayName?: string | null;
    roles: UserRole[];
    isBlocked: boolean;
    hasCandidateProfile?: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
  total: number;
  page: number;
  pageSize: number;
};

export type CreateAdminUserPayload = {
  email: string;
  password: string;
  roleCode: UserRole;
};

export const adminApi = {
  async listUsers(params?: {
    q?: string;
    status?: 'ACTIVE' | 'BLOCKED' | 'ALL';
    page?: number;
    pageSize?: number;
  }): Promise<AdminUsersListResponse> {
    const backendParams = {
      search: params?.q || undefined,
      isBlocked:
        params?.status === 'BLOCKED'
          ? true
          : params?.status === 'ACTIVE'
            ? false
            : undefined,
      page: params?.page,
      pageSize: params?.pageSize
    };

    const { data } = await http.get('/admin/users', { params: backendParams });
    return data;
  },

  async getUserById(userId: string) {
    const { data } = await http.get(`/admin/users/${userId}`);
    return data;
  },

  async createUser(payload: CreateAdminUserPayload) {
    const { data } = await http.post('/admin/users', payload);
    return data;
  },

  async blockUser(userId: string) {
    const { data } = await http.post(`/admin/users/${userId}/block`);
    return data;
  },

  async unblockUser(userId: string) {
    const { data } = await http.post(`/admin/users/${userId}/unblock`);
    return data;
  },

  async deleteUser(userId: string) {
    const { data } = await http.delete(`/admin/users/${userId}`);
    return data;
  },

  async assignRole(userId: string, role: UserRole) {
    const { data } = await http.post(`/admin/users/${userId}/roles`, {
      roleCode: role
    });
    return data;
  },

  async removeRole(userId: string, role: UserRole) {
    const { data } = await http.delete(`/admin/users/${userId}/roles`, {
      data: {
        roleCode: role
      }
    });
    return data;
  }
};
