import { Language, RoleCode, Theme } from '@prisma/client';
import { prisma } from '../../config/db';

export class AuthRepository {
  async findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: true
          }
        },
        preference: true,
        candidateProfile: true
      }
    });
  }

  async findRoleByCode(code: RoleCode) {
    return prisma.role.findUnique({
      where: { code }
    });
  }

  async createUserWithDefaults(params: { email: string; passwordHash: string }) {
    const candidateRole = await this.findRoleByCode(RoleCode.CANDIDATE);

    if (!candidateRole) {
      throw new Error('Candidate role not found');
    }

    return prisma.user.create({
      data: {
        email: params.email,
        passwordHash: params.passwordHash,
        roles: {
          create: {
            roleId: candidateRole.id
          }
        },
        preference: {
          create: {
            theme: Theme.LIGHT,
            language: Language.EN
          }
        },
        candidateProfile: {
          create: {}
        }
      },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });
  }

  async findSessionUserById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });
  }
}
