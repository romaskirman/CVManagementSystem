import { RoleCode } from '@prisma/client';
import { ForbiddenError } from '../../common/errors/ForbiddenError';
import { NotFoundError } from '../../common/errors/NotFoundError';
import { getPagination } from '../../utils/pagination';
import { UsersRepository } from './users.repository';
import { UpdateRolesInput, UsersQuery } from './users.types';

export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async listUsers(query: UsersQuery) {
    const pagination = getPagination(query);

    const result = await this.usersRepository.findUsers({
      skip: pagination.skip,
      take: pagination.take,
      search: query.search
    });

    return {
      items: result.items.map((user) => ({
        id: user.id,
        email: user.email,
        isBlocked: user.isBlocked,
        roles: user.roles.map((item) => item.role.code),
        theme: user.preference?.theme ?? null,
        language: user.preference?.language ?? null,
        createdAt: user.createdAt
      })),
      total: result.total,
      page: pagination.page,
      pageSize: pagination.pageSize
    };
  }

  async updateRoles(targetUserId: string, input: UpdateRolesInput, currentUserId: string) {
    const user = await this.usersRepository.findUserById(targetUserId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (targetUserId === currentUserId && !input.roles.includes('ADMIN')) {
      throw new ForbiddenError('Administrator cannot remove own admin role through this endpoint');
    }

    const roles = await this.usersRepository.findRolesByCodes(input.roles as RoleCode[]);

    if (roles.length !== input.roles.length) {
      throw new NotFoundError('One or more roles were not found');
    }

    const updatedUser = await this.usersRepository.replaceUserRoles(
      targetUserId,
      roles.map((role) => role.id)
    );

    if (!updatedUser) {
      throw new NotFoundError('User not found after role update');
    }

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      isBlocked: updatedUser.isBlocked,
      roles: updatedUser.roles.map((item) => item.role.code)
    };
  }

  async blockUser(targetUserId: string, currentUserId: string) {
    if (targetUserId === currentUserId) {
      throw new ForbiddenError('Administrator cannot block themselves');
    }

    const updatedUser = await this.usersRepository.setBlockedState(targetUserId, true);

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      isBlocked: updatedUser.isBlocked,
      roles: updatedUser.roles.map((item) => item.role.code)
    };
  }

  async unblockUser(targetUserId: string) {
    const updatedUser = await this.usersRepository.setBlockedState(targetUserId, false);

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      isBlocked: updatedUser.isBlocked,
      roles: updatedUser.roles.map((item) => item.role.code)
    };
  }

  async deleteUser(targetUserId: string, currentUserId: string) {
    if (targetUserId === currentUserId) {
      throw new ForbiddenError('Administrator cannot delete themselves');
    }

    await this.usersRepository.deleteUser(targetUserId);

    return {
      success: true
    };
  }
}
