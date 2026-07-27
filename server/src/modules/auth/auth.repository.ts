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
        }
      }
    });
  }

  async findRoleByCode(code: 'CANDIDATE' | 'RECRUITER' | 'ADMIN') {
    return prisma.role.findUnique({
      where: { code }
    });
  }

  async createUserWithDefaults(params: { email: string; passwordHash: string }) {
    const candidateRole = await this.findRoleByCode('CANDIDATE');

    if (!candidateRole) {
      throw new Error('Candidate role not found');
    }

    return prisma.user.create({
      data: {
        email: params.email,
        passwordHash: params.passwordHash,
        isAuthorized: false,
        roles: {
          create: {
            roleId: candidateRole.id
          }
        },
        preference: {
          create: {
            theme: 'LIGHT',
            language: 'EN'
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

  async createEmailVerificationCode(params: {
    userId: string;
    codeHash: string;
    expiresAt: Date;
  }) {
    await prisma.emailVerificationCode.updateMany({
      where: {
        userId: params.userId,
        consumedAt: null
      },
      data: {
        consumedAt: new Date()
      }
    });

    return prisma.emailVerificationCode.create({
      data: {
        userId: params.userId,
        codeHash: params.codeHash,
        expiresAt: params.expiresAt
      }
    });
  }

  async findActiveEmailVerificationCodes(userId: string) {
    return prisma.emailVerificationCode.findMany({
      where: {
        userId,
        consumedAt: null,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async consumeEmailVerificationCode(codeId: string) {
    return prisma.emailVerificationCode.update({
      where: { id: codeId },
      data: {
        consumedAt: new Date()
      }
    });
  }

  async markUserAuthorized(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        isAuthorized: true,
        authorizedAt: new Date()
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
}
