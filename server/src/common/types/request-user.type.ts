import { RoleCode } from '@prisma/client';

export type RequestUser = {
  id: string;
  email: string;
  isBlocked: boolean;
  roles: RoleCode[];
};
