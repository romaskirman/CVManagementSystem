import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { requireRoles } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { ROLES } from '../common/constants/roles';
import { UsersRepository } from '../modules/users/users.repository';
import { UsersService } from '../modules/users/users.service';
import { UsersController } from '../modules/users/users.controller';
import { updateRolesSchema, usersQuerySchema } from '../modules/users/users.schemas';

const router = Router();

const usersRepository = new UsersRepository();
const usersService = new UsersService(usersRepository);
const usersController = new UsersController(usersService);

router.use(requireAuth, requireRoles(ROLES.ADMIN));

router.get('/', validate(usersQuerySchema, 'query'), usersController.listUsers);
router.patch('/:id/roles', validate(updateRolesSchema), usersController.updateRoles);
router.patch('/:id/block', usersController.blockUser);
router.patch('/:id/unblock', usersController.unblockUser);
router.delete('/:id', usersController.deleteUser);

export const usersRouter = router;
