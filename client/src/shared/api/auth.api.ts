import { http } from './http';

export type AuthUser = {
  id: string;
  email: string;
  roles: string[];
  isBlocked?: boolean;
};

type AuthResponse = {
  user: AuthUser | null;
};

type LogoutResponse = {
  success: boolean;
};

type SignInPayload = {
  email: string;
  password: string;
};

type RegisterPayload = {
  email: string;
  password: string;
};

export const authApi = {
  async me(): Promise<AuthUser | null> {
    const { data } = await http.get<AuthResponse>('/auth/me');
    return data.user;
  },

  async login(payload: SignInPayload): Promise<AuthUser | null> {
    const { data } = await http.post<AuthResponse>('/auth/login', payload);
    return data.user;
  },

  async register(payload: RegisterPayload): Promise<AuthUser | null> {
    const { data } = await http.post<AuthResponse>('/auth/register', payload);
    return data.user;
  },

  async logout(): Promise<boolean> {
    const { data } = await http.post<LogoutResponse>('/auth/logout');
    return data.success;
  }
};
