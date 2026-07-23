import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { rejectBlockedUsers } from '../middlewares/blocked-user.middleware';
import { validate } from '../middlewares/validate.middleware';
import { DiscussionsRepository } from '../modules/discussions/discussions.repository';
import { DiscussionsService } from '../modules/discussions/discussions.service';
import { DiscussionsController } from '../modules/discussions/discussions.controller';
import {
  createDiscussionPostSchema,
  discussionPostsQuerySchema
} from '../modules/discussions/discussions.schemas';
import { PositionsRepository } from '../modules/positions/positions.repository';
import { PositionAccessRulesService } from '../modules/positions/position-access-rules.service';
import { PositionsService } from '../modules/positions/positions.service';

const router = Router();

const discussionsRepository = new DiscussionsRepository();

const positionsRepository = new PositionsRepository();
const positionAccessRulesService = new PositionAccessRulesService();
const positionsService = new PositionsService(positionsRepository, positionAccessRulesService);

const discussionsService = new DiscussionsService(discussionsRepository, positionsService);
const discussionsController = new DiscussionsController(discussionsService);

router.use(requireAuth, rejectBlockedUsers);

router.get(
  '/positions/:positionId/posts',
  validate(discussionPostsQuerySchema, 'query'),
  discussionsController.listPosts
);

router.post(
  '/positions/:positionId/posts',
  validate(createDiscussionPostSchema),
  discussionsController.createPost
);

router.get(
  '/positions/:positionId/activity',
  discussionsController.getLatestActivity
);

export const discussionsRouter = router;
