import { Prisma } from '@prisma/client';
import { AuthError } from '../../common/errors/AuthError';
import { ConflictError } from '../../common/errors/ConflictError';
import { mapPrismaError } from '../../utils/prisma-errors';
import { AuthRepository } from './auth.repository';
import { PasswordService } from '../auth/passport.service';
import { LoginInput, RegisterInput, SessionUserDto } from './auth.types';

export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  async register(input: RegisterInput): Promise<SessionUserDto> {
    const existingUser = await this.authRepository.findUserByEmail(input.email);

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    const passwordHash = await PasswordService.hash(input.password);

    try {
      const user = await this.authRepository.createUserWithDefaults({
        email: input.email,
        passwordHash
      });

      return {
        id: user.id,
        email: user.email,
        isBlocked: user.isBlocked,
        roles: user.roles.map((item) => item.role.code)
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        mapPrismaError(error);
      }

      throw error;
    }
  }

  async login(input: LoginInput): Promise<SessionUserDto> {
    const existingUser = await this.authRepository.findUserByEmail(input.email);

    if (!existingUser) {
      const passwordHash = await PasswordService.hash(input.password);

      try {
        const createdUser = await this.authRepository.createUserWithDefaults({
          email: input.email,
          passwordHash
        });

        return {
          id: createdUser.id,
          email: createdUser.email,
          isBlocked: createdUser.isBlocked,
          roles: createdUser.roles.map((item) => item.role.code)
        };
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          mapPrismaError(error);
        }

        throw error;
      }
    }

    if (!existingUser.passwordHash) {
      throw new AuthError('Invalid email or password');
    }

    const isValidPassword = await PasswordService.compare(
      input.password,
      existingUser.passwordHash
    );

    if (!isValidPassword) {
      throw new AuthError('Invalid email or password');
    }

    if (existingUser.isBlocked) {
      throw new AuthError('User is blocked');
    }

    return {
      id: existingUser.id,
      email: existingUser.email,
      isBlocked: existingUser.isBlocked,
      roles: existingUser.roles.map((item) => item.role.code)
    };
  }

  async getCurrentUser(userId: string): Promise<SessionUserDto | null> {
    const user = await this.authRepository.findSessionUserById(userId);

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      isBlocked: user.isBlocked,
      roles: user.roles.map((item) => item.role.code)
    };
  }
}
