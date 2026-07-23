import { RoleCode } from '@prisma/client';
import { ConflictError } from '../../common/errors/ConflictError';
import { ForbiddenError } from '../../common/errors/ForbiddenError';
import { NotFoundError } from '../../common/errors/NotFoundError';
import { ValidationError } from '../../common/errors/ValidationError';
import { RequestUser } from '../../common/types/request-user.type';
import { getPagination } from '../../utils/pagination';
import { isAdmin } from '../../utils/permissions';
import { PasswordService } from '../auth/passport.service';
import { AdminRepository } from './admin.repository';
import {
  AdminUsersQuery,
  AssignRoleInput,
  CreateUserInput,
  RemoveRoleInput
} from './admin.types';

type AdminMappedUser = {
  id: string;
  email: string;
  isBlocked: boolean;
  roles: RoleCode[];
  hasCandidateProfile: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export class AdminService {
  constructor(private readonly adminRepository: AdminRepository) {}

  async listUsers(query: AdminUsersQuery, currentUser: RequestUser) {
    this.ensureAdmin(currentUser);

    const pagination = getPagination(query);
    const result = await this.adminRepository.listUsers({
      skip: pagination.skip,
      take: pagination.pageSize,
      search: query.search,
      isBlocked: query.isBlocked,
      role: query.role
    });

    return {
      items: result.items.map((user) => this.mapUser(user)),
      total: result.total,
      page: pagination.page,
      pageSize: pagination.pageSize
    };
  }

  async getUserById(userId: string, currentUser: RequestUser) {
    this.ensureAdmin(currentUser);

    const user = await this.adminRepository.findUserById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return this.mapUser(user);
  }

  async createUser(input: CreateUserInput, currentUser: RequestUser) {
    this.ensureAdmin(currentUser);

    const existingUser = await this.adminRepository.findUserByEmail(input.email);

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    const passwordHash = await PasswordService.hash(input.password);

    const createdUser = await this.adminRepository.createUserWithRole({
      email: input.email,
      passwordHash,
      roleCode: input.roleCode
    });

    return {
      user: this.mapUser(createdUser),
      message: `User created with role ${input.roleCode}`
    };
  }

  async blockUser(userId: string, currentUser: RequestUser) {
    this.ensureAdmin(currentUser);

    if (currentUser.id === userId) {
      throw new ValidationError('Administrator cannot block themselves');
    }

    const user = await this.adminRepository.findUserById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const updated = await this.adminRepository.updateBlockedState(userId, true);
    return this.mapUser(updated);
  }

  async unblockUser(userId: string, currentUser: RequestUser) {
    this.ensureAdmin(currentUser);

    const user = await this.adminRepository.findUserById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const updated = await this.adminRepository.updateBlockedState(userId, false);
    return this.mapUser(updated);
  }

  async assignRole(userId: string, input: AssignRoleInput, currentUser: RequestUser) {
    this.ensureAdmin(currentUser);

    const [user, role] = await Promise.all([
      this.adminRepository.findUserById(userId),
      this.adminRepository.findRoleByCode(input.roleCode)
    ]);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (!role) {
      throw new NotFoundError('Role not found');
    }

    const hasRole = user.roles.some((item) => item.role.code === input.roleCode);

    if (hasRole) {
      throw new ConflictError(`User already has role ${input.roleCode}`);
    }

    await this.adminRepository.assignRole(userId, role.id);

    if (input.roleCode === RoleCode.CANDIDATE) {
      await this.adminRepository.ensureCandidateProfile(userId);
    }

    const updated = await this.adminRepository.findUserById(userId);

    if (!updated) {
      throw new NotFoundError('User not found after role assignment');
    }

    return this.mapUser(updated);
  }

  async removeRole(userId: string, input: RemoveRoleInput, currentUser: RequestUser) {
    this.ensureAdmin(currentUser);

    const [user, role] = await Promise.all([
      this.adminRepository.findUserById(userId),
      this.adminRepository.findRoleByCode(input.roleCode)
    ]);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (!role) {
      throw new NotFoundError('Role not found');
    }

    const hasRole = user.roles.some((item) => item.role.code === input.roleCode);

    if (!hasRole) {
      throw new NotFoundError(`User does not have role ${input.roleCode}`);
    }

    if (currentUser.id === userId && input.roleCode === RoleCode.ADMIN) {
      const adminRolesCount = user.roles.filter((item) => item.role.code === RoleCode.ADMIN).length;

      if (adminRolesCount > 0) {
        throw new ValidationError('Administrator cannot remove ADMIN role from themselves');
      }
    }

    if (input.roleCode === RoleCode.CANDIDATE) {
      const candidateData = await this.adminRepository.countCandidateRelatedData(userId);

      if (
        candidateData.attributeValuesCount > 0 ||
        candidateData.projectsCount > 0 ||
        candidateData.cvsCount > 0
      ) {
        throw new ValidationError(
          'Cannot remove CANDIDATE role because candidate data already exists',
          candidateData
        );
      }
    }

    await this.adminRepository.removeRole(userId, role.id);

    if (input.roleCode === RoleCode.CANDIDATE) {
      await this.adminRepository.deleteCandidateProfile(userId);
    }

    const updated = await this.adminRepository.findUserById(userId);

    if (!updated) {
      throw new NotFoundError('User not found after role removal');
    }

    return this.mapUser(updated);
  }

  async deleteUser(userId: string, currentUser: RequestUser) {
    this.ensureAdmin(currentUser);

    if (currentUser.id === userId) {
      throw new ValidationError('Administrator cannot delete themselves');
    }

    const user = await this.adminRepository.findUserById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    await this.adminRepository.deleteUser(userId);

    return {
      success: true
    };
  }

  private ensureAdmin(currentUser: RequestUser) {
    if (!isAdmin(currentUser.roles)) {
      throw new ForbiddenError('Administrator access required');
    }
  }

  private mapUser(user: {
    id: string;
    email: string;
    isBlocked: boolean;
    roles: Array<{ role: { code: RoleCode } }>;
    candidateProfile: unknown | null;
    createdAt: Date;
    updatedAt: Date;
  } | null): AdminMappedUser | null {
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      isBlocked: user.isBlocked,
      roles: user.roles.map((item) => item.role.code),
      hasCandidateProfile: Boolean(user.candidateProfile),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }
}
