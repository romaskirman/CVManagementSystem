import { Prisma, RoleCode } from '@prisma/client';
import { prisma } from '../../config/db';

export class UsersRepository {
  async findUsers(params: { skip: number; take: number; search?: string }) {
    const where: Prisma.UserWhereInput = params.search
      ? {
          email: {
            contains: params.search,
            mode: 'insensitive'
          }
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          roles: {
            include: {
              role: true
            }
          },
          preference: true
        }
      }),
      prisma.user.count({ where })
    ]);

    return { items, total };
  }

  async findUserById(userId: string) {
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

  async findRolesByCodes(roleCodes: RoleCode[]) {
    return prisma.role.findMany({
      where: {
        code: {
          in: roleCodes
        }
      }
    });
  }

  async replaceUserRoles(userId: string, roleIds: string[]) {
    await prisma.userRole.deleteMany({
      where: { userId }
    });

    await prisma.userRole.createMany({
      data: roleIds.map((roleId) => ({
        userId,
        roleId
      }))
    });

    return this.findUserById(userId);
  }

  async setBlockedState(userId: string, isBlocked: boolean) {
    return prisma.user.update({
      where: { id: userId },
      data: { isBlocked },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });
  }

  async deleteUser(userId: string) {
    return prisma.user.delete({
      where: { id: userId }
    });
  }
}
