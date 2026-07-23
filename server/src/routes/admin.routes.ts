import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { rejectBlockedUsers } from '../middlewares/blocked-user.middleware';
import { validate } from '../middlewares/validate.middleware';
import { AdminController } from '../modules/admin/admin.controller';
import { AdminRepository } from '../modules/admin/admin.repository';
import { AdminService } from '../modules/admin/admin.service';
import {
  adminUsersQuerySchema,
  assignRoleSchema,
  createUserSchema,
  removeRoleSchema
} from '../modules/admin/admin.schemas';

const router = Router();

const adminRepository = new AdminRepository();
const adminService = new AdminService(adminRepository);
const adminController = new AdminController(adminService);

router.use(requireAuth, rejectBlockedUsers);

router.get('/users', validate(adminUsersQuerySchema, 'query'), adminController.listUsers);
router.get('/users/:userId', adminController.getUserById);

router.post('/users', validate(createUserSchema), adminController.createUser);
router.post('/users/:userId/block', adminController.blockUser);
router.post('/users/:userId/unblock', adminController.unblockUser);
router.post('/users/:userId/roles', validate(assignRoleSchema), adminController.assignRole);
router.delete('/users/:userId/roles', validate(removeRoleSchema), adminController.removeRole);
router.delete('/users/:userId', adminController.deleteUser);

export const adminRouter = router;
