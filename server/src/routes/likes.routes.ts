import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { rejectBlockedUsers } from '../middlewares/blocked-user.middleware';
import { AttributesRepository } from '../modules/attributes/attributes.repository';
import { RecentAttributesService } from '../modules/attributes/recent-attributes.service';
import { CvRepository } from '../modules/cv/cv.repository';
import { CvGenerationService } from '../modules/cv/cv-generation.service';
import { CvService } from '../modules/cv/cv.service';
import { CvVisibilityService } from '../modules/cv/cv-visibility.service';
import { LikesController } from '../modules/likes/likes.controller';
import { LikesRepository } from '../modules/likes/likes.repository';
import { LikesService } from '../modules/likes/likes.service';
import { PositionsRepository } from '../modules/positions/positions.repository';
import { PositionAccessRulesService } from '../modules/positions/position-access-rules.service';
import { PositionsService } from '../modules/positions/positions.service';

const router = Router();

const cvRepository = new CvRepository();
const cvGenerationService = new CvGenerationService(cvRepository);

const positionsRepository = new PositionsRepository();
const positionAccessRulesService = new PositionAccessRulesService();
const positionsService = new PositionsService(positionsRepository, positionAccessRulesService);

const cvVisibilityService = new CvVisibilityService(positionsService);

const likesRepository = new LikesRepository();

const attributesRepository = new AttributesRepository();
const recentAttributesService = new RecentAttributesService(attributesRepository);

const cvService = new CvService(
  cvRepository,
  cvGenerationService,
  cvVisibilityService,
  recentAttributesService
);

void cvService;

const likesService = new LikesService(likesRepository, cvRepository, cvVisibilityService);
const likesController = new LikesController(likesService);

router.use(requireAuth, rejectBlockedUsers);

router.post('/cv/:cvId/like', likesController.likeCv);
router.delete('/cv/:cvId/like', likesController.unlikeCv);

export const likesRouter = router;
