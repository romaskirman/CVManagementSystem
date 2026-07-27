export interface RegisterInput {
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface VerifyEmailInput {
  code: string;
}

export interface ResendVerificationCodeInput {
  email?: string;
}

export interface SessionUserDto {
  id: string;
  email: string;
  roles: string[];
  isBlocked: boolean;
  isAuthorized: boolean;
}
