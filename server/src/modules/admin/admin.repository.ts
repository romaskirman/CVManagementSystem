import { Prisma, RoleCode } from '@prisma/client';
import { prisma } from '../../config/db';

export class AdminRepository {
  async findUserById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: true
          }
        },
        candidateProfile: true
      }
    });
  }

  async findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: true
          }
        },
        candidateProfile: true
      }
    });
  }

  async findRoleByCode(roleCode: RoleCode) {
    return prisma.role.findUnique({
      where: {
        code: roleCode
      }
    });
  }

  async listUsers(params: {
    skip: number;
    take: number;
    search?: string;
    isBlocked?: boolean;
    role?: RoleCode;
  }) {
    const where: Prisma.UserWhereInput = {
      ...(typeof params.isBlocked === 'boolean' ? { isBlocked: params.isBlocked } : {}),
      ...(params.search
        ? {
            email: {
              contains: params.search,
              mode: 'insensitive'
            }
          }
        : {}),
      ...(params.role
        ? {
            roles: {
              some: {
                role: {
                  code: params.role
                }
              }
            }
          }
        : {})
    };

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          roles: {
            include: {
              role: true
            }
          },
          candidateProfile: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: params.skip,
        take: params.take
      }),
      prisma.user.count({ where })
    ]);

    return { items, total };
  }

  async updateBlockedState(userId: string, isBlocked: boolean) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        isBlocked
      },
      include: {
        roles: {
          include: {
            role: true
          }
        },
        candidateProfile: true
      }
    });
  }

  async assignRole(userId: string, roleId: string) {
    return prisma.userRole.create({
      data: {
        userId,
        roleId
      }
    });
  }

  async removeRole(userId: string, roleId: string) {
    return prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId,
          roleId
        }
      }
    });
  }

  async createUserWithRole(params: {
    email: string;
    passwordHash: string;
    roleCode: RoleCode;
  }) {
    const role = await this.findRoleByCode(params.roleCode);

    if (!role) {
      throw new Error(`Role ${params.roleCode} not found`);
    }

    return prisma.user.create({
      data: {
        email: params.email,
        passwordHash: params.passwordHash,
        roles: {
          create: {
            roleId: role.id
          }
        },
        preference: {
          create: {
            theme: 'LIGHT',
            language: 'EN'
          }
        },
        ...(params.roleCode === RoleCode.CANDIDATE
          ? {
              candidateProfile: {
                create: {}
              }
            }
          : {})
      },
      include: {
        roles: {
          include: {
            role: true
          }
        },
        candidateProfile: true
      }
    });
  }

  async ensureCandidateProfile(userId: string) {
    const existing = await prisma.candidateProfile.findUnique({
      where: { userId }
    });

    if (existing) {
      return existing;
    }

    return prisma.candidateProfile.create({
      data: {
        userId
      }
    });
  }

  async deleteCandidateProfile(userId: string) {
    const existing = await prisma.candidateProfile.findUnique({
      where: { userId }
    });

    if (!existing) {
      return null;
    }

    return prisma.candidateProfile.delete({
      where: {
        userId
      }
    });
  }

  async countCandidateRelatedData(userId: string) {
    const profile = await prisma.candidateProfile.findUnique({
      where: { userId },
      include: {
        _count: {
          select: {
            attributeValues: true,
            projects: true,
            cvs: true
          }
        }
      }
    });

    if (!profile) {
      return {
        hasProfile: false,
        attributeValuesCount: 0,
        projectsCount: 0,
        cvsCount: 0
      };
    }

    return {
      hasProfile: true,
      attributeValuesCount: profile._count.attributeValues,
      projectsCount: profile._count.projects,
      cvsCount: profile._count.cvs
    };
  }

  async deleteUser(userId: string) {
    return prisma.user.delete({
      where: { id: userId }
    });
  }
}
