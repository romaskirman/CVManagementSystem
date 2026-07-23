import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { rejectBlockedUsers } from '../middlewares/blocked-user.middleware';
import { validate } from '../middlewares/validate.middleware';
import { PositionsRepository } from '../modules/positions/positions.repository';
import { PositionAccessRulesService } from '../modules/positions/position-access-rules.service';
import { PositionsService } from '../modules/positions/positions.service';
import { PositionsController } from '../modules/positions/positions.controller';
import {
  createPositionSchema,
  positionsQuerySchema,
  updatePositionSchema
} from '../modules/positions/positions.schemas';

const router = Router();

const positionsRepository = new PositionsRepository();
const positionAccessRulesService = new PositionAccessRulesService();
const positionsService = new PositionsService(positionsRepository, positionAccessRulesService);
const positionsController = new PositionsController(positionsService);

router.get('/', validate(positionsQuerySchema, 'query'), positionsController.listPositions);
router.get('/:id', positionsController.getPositionById);

router.post('/', requireAuth, rejectBlockedUsers, validate(createPositionSchema), positionsController.createPosition);
router.patch('/:id', requireAuth, rejectBlockedUsers, validate(updatePositionSchema), positionsController.updatePosition);
router.delete('/:id', requireAuth, rejectBlockedUsers, positionsController.deletePosition);
router.post('/:id/duplicate', requireAuth, rejectBlockedUsers, positionsController.duplicatePosition);

export const positionsRouter = router;
