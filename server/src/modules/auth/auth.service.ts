import { Prisma } from '@prisma/client';
import { AuthError } from '../../common/errors/AuthError';
import { ConflictError } from '../../common/errors/ConflictError';
import { NotFoundError } from '../../common/errors/NotFoundError';
import { ValidationError } from '../../common/errors/ValidationError';
import { mapPrismaError } from '../../utils/prisma-errors';
import { AuthRepository } from './auth.repository';
import { PasswordService } from '../auth/passport.service';
import {
  LoginInput,
  RegisterInput,
  SessionUserDto,
  VerifyEmailInput
} from './auth.types';
import { VerificationCodeService } from './verification-code.service';

type SessionUserRecord = {
  id: string;
  email: string;
  isBlocked: boolean;
  isAuthorized?: boolean;
  roles?: Array<{ role: { code: string } }>;
};

function mapSessionUser(user: SessionUserRecord): SessionUserDto {
  return {
    id: user.id,
    email: user.email,
    isBlocked: user.isBlocked,
    isAuthorized: user.isAuthorized ?? true,
    roles: (user.roles ?? []).map((item) => item.role.code)
  };
}

export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly verificationCodeService: VerificationCodeService
  ) {}

  async register(input: RegisterInput): Promise<SessionUserDto> {
    const email = input.email.trim().toLowerCase();
    console.log('[AuthService.register] start', { email });

    const existingUser = await this.authRepository.findUserByEmail(email);

    if (existingUser) {
      console.warn('[AuthService.register] user already exists', { email });
      throw new ConflictError('User with this email already exists');
    }

    const passwordHash = await PasswordService.hash(input.password);

    try {
      const user = await this.authRepository.createUserWithDefaults({
        email,
        passwordHash
      });

      console.log('[AuthService.register] user created', {
        userId: user.id,
        email: user.email,
        isAuthorized: true
      });

      await this.issueVerificationCode(user.id, user.email);

      console.log('[AuthService.register] verification code issued', {
        userId: user.id,
        email: user.email
      });

      return mapSessionUser(user);
    } catch (error) {
      console.error('[AuthService.register] failed', {
        email,
        error: error instanceof Error ? error.message : error
      });

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        mapPrismaError(error);
      }

      throw error;
    }
  }

  async login(input: LoginInput): Promise<SessionUserDto> {
    const email = input.email.trim().toLowerCase();
    console.log('[AuthService.login] start', { email });

    const user = await this.authRepository.findUserByEmail(email);

    if (!user || !user.passwordHash) {
      console.warn('[AuthService.login] invalid credentials - user not found or missing password', {
        email
      });
      throw new AuthError('Invalid email or password');
    }

    const isValidPassword = await PasswordService.compare(input.password, user.passwordHash);

    if (!isValidPassword) {
      console.warn('[AuthService.login] invalid credentials - password mismatch', { email });
      throw new AuthError('Invalid email or password');
    }

    if (user.isBlocked) {
      console.warn('[AuthService.login] blocked user login attempt', {
        userId: user.id,
        email: user.email
      });
      throw new AuthError('User is blocked');
    }

    console.log('[AuthService.login] success', {
      userId: user.id,
      email: user.email,
      isAuthorized: true
    });

    return mapSessionUser(user);
  }

  async verifyEmail(userId: string, input: VerifyEmailInput): Promise<SessionUserDto> {
    console.log('[AuthService.verifyEmail] start', {
      userId,
      codeLength: input.code?.length ?? 0
    });

    const user = await this.authRepository.findSessionUserById(userId);

    if (!user) {
      console.warn('[AuthService.verifyEmail] user not found', { userId });
      throw new NotFoundError('User not found');
    }

    if (user.isBlocked) {
      console.warn('[AuthService.verifyEmail] blocked user', {
        userId,
        email: user.email
      });
      throw new AuthError('User is blocked');
    }

    if ((user as SessionUserRecord).isAuthorized ?? false) {
      console.log('[AuthService.verifyEmail] already authorized', {
        userId,
        email: user.email
      });
      return mapSessionUser(user);
    }

    const activeCodes = await this.authRepository.findActiveEmailVerificationCodes(userId);

    console.log('[AuthService.verifyEmail] active codes loaded', {
      userId,
      activeCodesCount: activeCodes.length
    });

    const matchedCode = activeCodes.find((item: { id: string; codeHash: string }) =>
      this.verificationCodeService.verifyCode(input.code, item.codeHash)
    );

    if (!matchedCode) {
      console.warn('[AuthService.verifyEmail] no matching code', {
        userId,
        activeCodesCount: activeCodes.length
      });
      throw new ValidationError('Invalid or expired verification code');
    }

    console.log('[AuthService.verifyEmail] matched code found', {
      userId,
      codeId: matchedCode.id
    });

    await this.authRepository.consumeEmailVerificationCode(matchedCode.id);
    const authorizedUser = await this.authRepository.markUserAuthorized(userId);

    console.log('[AuthService.verifyEmail] user authorized', {
      userId,
      email: authorizedUser.email
    });

    return mapSessionUser(authorizedUser);
  }

  async resendVerificationCode(input: {
    currentUserId?: string;
    email?: string;
  }): Promise<void> {
    console.log('[AuthService.resendVerificationCode] start', {
      currentUserId: input.currentUserId ?? null,
      email: input.email ?? null
    });

    let user: Awaited<ReturnType<AuthRepository['findSessionUserById']>> | null = null;

    if (input.currentUserId) {
      user = await this.authRepository.findSessionUserById(input.currentUserId);
      console.log('[AuthService.resendVerificationCode] lookup by currentUserId finished', {
        currentUserId: input.currentUserId,
        found: Boolean(user)
      });
    } else if (input.email) {
      const normalizedEmail = input.email.trim().toLowerCase();
      user = await this.authRepository.findUserByEmail(normalizedEmail);
      console.log('[AuthService.resendVerificationCode] lookup by email finished', {
        email: normalizedEmail,
        found: Boolean(user)
      });
    }

    if (!user) {
      console.warn('[AuthService.resendVerificationCode] user not found', {
        currentUserId: input.currentUserId ?? null,
        email: input.email ?? null
      });
      throw new NotFoundError('User not found');
    }

    if (user.isBlocked) {
      console.warn('[AuthService.resendVerificationCode] blocked user', {
        userId: user.id,
        email: user.email
      });
      throw new AuthError('User is blocked');
    }

    if ((user as SessionUserRecord).isAuthorized ?? false) {
      console.log('[AuthService.resendVerificationCode] user already authorized, skip resend', {
        userId: user.id,
        email: user.email
      });
      return;
    }

    await this.issueVerificationCode(user.id, user.email);

    console.log('[AuthService.resendVerificationCode] verification code re-issued', {
      userId: user.id,
      email: user.email
    });
  }

  async getCurrentUser(userId: string): Promise<SessionUserDto | null> {
    console.log('[AuthService.getCurrentUser] start', { userId });

    const user = await this.authRepository.findSessionUserById(userId);

    if (!user) {
      console.log('[AuthService.getCurrentUser] user not found', { userId });
      return null;
    }

    console.log('[AuthService.getCurrentUser] success', {
      userId,
      email: user.email,
      isAuthorized: true
    });

    return mapSessionUser(user);
  }

  private async issueVerificationCode(userId: string, email: string): Promise<void> {
    console.log('[AuthService.issueVerificationCode] start', { userId, email });

    const code = this.verificationCodeService.generateCode();
    const codeHash = this.verificationCodeService.hashCode(code);
    const expiresAt = this.verificationCodeService.getExpiresAt();

    console.log('[AuthService.issueVerificationCode] code generated', {
      userId,
      email,
      codePreview: `${code.slice(0, 2)}****`,
      expiresAt: expiresAt.toISOString()
    });

    await this.authRepository.createEmailVerificationCode({
      userId,
      codeHash,
      expiresAt
    });

    console.log('[AuthService.issueVerificationCode] code saved to database', {
      userId,
      email
    });

    await this.verificationCodeService.sendVerificationCode({
      email,
      code
    });

    console.log('[AuthService.issueVerificationCode] sendVerificationCode completed', {
      userId,
      email
    });
  }
}
