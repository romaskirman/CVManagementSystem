export interface RegisterInput {
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface SessionUserDto {
  id: string;
  email: string;
  roles: string[];
  isBlocked: boolean;
}
