import { prisma } from '../../config/db';

type VerificationCodeRecord = {
  id: string;
  userId: string;
  codeHash: string;
  expiresAt: Date;
  consumedAt: Date | null;
  createdAt: Date;
  updatedAt?: Date;
};

const verificationCodesStore = new Map<string, VerificationCodeRecord>();

function createVerificationCodeId(): string {
  return `verification-code-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

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
    const now = new Date();

    for (const [id, record] of verificationCodesStore.entries()) {
      if (record.userId === params.userId && record.consumedAt === null) {
        verificationCodesStore.set(id, {
          ...record,
          consumedAt: now
        });
      }
    }

    const record: VerificationCodeRecord = {
      id: createVerificationCodeId(),
      userId: params.userId,
      codeHash: params.codeHash,
      expiresAt: params.expiresAt,
      consumedAt: null,
      createdAt: now
    };

    verificationCodesStore.set(record.id, record);

    return record;
  }

  async findActiveEmailVerificationCodes(userId: string) {
    const now = new Date();

    return Array.from(verificationCodesStore.values())
      .filter(
        (record) =>
          record.userId === userId &&
          record.consumedAt === null &&
          record.expiresAt > now
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async consumeEmailVerificationCode(codeId: string) {
    const existing = verificationCodesStore.get(codeId);

    if (!existing) {
      throw new Error('Verification code not found');
    }

    const updated: VerificationCodeRecord = {
      ...existing,
      consumedAt: new Date()
    };

    verificationCodesStore.set(codeId, updated);

    return updated;
  }

  async markUserAuthorized(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {},
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
