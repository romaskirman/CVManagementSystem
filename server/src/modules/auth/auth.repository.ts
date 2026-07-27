import { prisma } from '../../config/db';

type SessionUserDbRow = {
  id: string;
  email: string;
  isBlocked: boolean;
  isAuthorized: boolean | null;
};

type EmailVerificationCodeRow = {
  id: string;
  userId: string;
  codeHash: string;
  expiresAt: Date;
  consumedAt: Date | null;
  createdAt: Date;
};

type RoleCodeRow = {
  code: string;
};

export class AuthRepository {
  async findUserByEmail(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!user) {
      return null;
    }

    const rows = await prisma.$queryRaw<SessionUserDbRow[]>`
      SELECT "id", "email", "isBlocked", "isAuthorized"
      FROM "User"
      WHERE "id" = ${user.id}
      LIMIT 1
    `;

    const rawUser = rows[0];

    return {
      ...user,
      isAuthorized: rawUser?.isAuthorized ?? false
    };
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

    const user = await prisma.user.create({
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

    await prisma.$executeRaw`
      UPDATE "User"
      SET "isAuthorized" = false,
          "authorizedAt" = NULL
      WHERE "id" = ${user.id}
    `;

    return {
      ...user,
      isAuthorized: false
    };
  }

  async findSessionUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!user) {
      return null;
    }

    const rows = await prisma.$queryRaw<SessionUserDbRow[]>`
      SELECT "id", "email", "isBlocked", "isAuthorized"
      FROM "User"
      WHERE "id" = ${userId}
      LIMIT 1
    `;

    const rawUser = rows[0];

    return {
      ...user,
      isAuthorized: rawUser?.isAuthorized ?? false
    };
  }

  async createEmailVerificationCode(params: {
    userId: string;
    codeHash: string;
    expiresAt: Date;
  }) {
    await prisma.$executeRaw`
      UPDATE "EmailVerificationCode"
      SET "consumedAt" = NOW()
      WHERE "userId" = ${params.userId}
        AND "consumedAt" IS NULL
    `;

    await prisma.$executeRaw`
      INSERT INTO "EmailVerificationCode" ("id", "userId", "codeHash", "expiresAt", "createdAt")
      VALUES (gen_random_uuid()::text, ${params.userId}, ${params.codeHash}, ${params.expiresAt}, NOW())
    `;

    const rows = await prisma.$queryRaw<EmailVerificationCodeRow[]>`
      SELECT "id", "userId", "codeHash", "expiresAt", "consumedAt", "createdAt"
      FROM "EmailVerificationCode"
      WHERE "userId" = ${params.userId}
        AND "consumedAt" IS NULL
      ORDER BY "createdAt" DESC
      LIMIT 1
    `;

    return rows[0] ?? null;
  }

  async findActiveEmailVerificationCodes(userId: string) {
    return prisma.$queryRaw<EmailVerificationCodeRow[]>`
      SELECT "id", "userId", "codeHash", "expiresAt", "consumedAt", "createdAt"
      FROM "EmailVerificationCode"
      WHERE "userId" = ${userId}
        AND "consumedAt" IS NULL
        AND "expiresAt" > NOW()
      ORDER BY "createdAt" DESC
    `;
  }

  async consumeEmailVerificationCode(codeId: string) {
    await prisma.$executeRaw`
      UPDATE "EmailVerificationCode"
      SET "consumedAt" = NOW()
      WHERE "id" = ${codeId}
    `;

    const rows = await prisma.$queryRaw<EmailVerificationCodeRow[]>`
      SELECT "id", "userId", "codeHash", "expiresAt", "consumedAt", "createdAt"
      FROM "EmailVerificationCode"
      WHERE "id" = ${codeId}
      LIMIT 1
    `;

    if (!rows[0]) {
      throw new Error('Verification code not found');
    }

    return rows[0];
  }

  async markUserAuthorized(userId: string) {
    await prisma.$executeRaw`
      UPDATE "User"
      SET "isAuthorized" = true,
          "authorizedAt" = NOW()
      WHERE "id" = ${userId}
    `;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!user) {
      throw new Error('User not found after authorization update');
    }

    return {
      ...user,
      isAuthorized: true
    };
  }

  async getUserAuthorizationState(userId: string): Promise<boolean> {
    const rows = await prisma.$queryRaw<Array<{ isAuthorized: boolean | null }>>`
      SELECT "isAuthorized"
      FROM "User"
      WHERE "id" = ${userId}
      LIMIT 1
    `;

    return rows[0]?.isAuthorized ?? false;
  }

  async getAuthorizationStatesByEmail(email: string): Promise<boolean[]> {
    const rows = await prisma.$queryRaw<Array<{ isAuthorized: boolean | null }>>`
      SELECT "isAuthorized"
      FROM "User"
      WHERE "email" = ${email}
    `;

    return rows.map((row) => row.isAuthorized ?? false);
  }

  async getUserRoleCodes(userId: string): Promise<string[]> {
    const rows = await prisma.$queryRaw<RoleCodeRow[]>`
      SELECT r."code" as "code"
      FROM "UserRole" ur
      JOIN "Role" r ON r."id" = ur."roleId"
      WHERE ur."userId" = ${userId}
    `;

    return rows.map((row) => row.code);
  }
}
