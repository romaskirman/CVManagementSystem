import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { rejectBlockedUsers } from '../middlewares/blocked-user.middleware';
import { validate } from '../middlewares/validate.middleware';
import { AttributesRepository } from '../modules/attributes/attributes.repository';
import { RecentAttributesService } from '../modules/attributes/recent-attributes.service';
import { CvController } from '../modules/cv/cv.controller';
import { CvGenerationService } from '../modules/cv/cv-generation.service';
import { CvRepository } from '../modules/cv/cv.repository';
import { CvService } from '../modules/cv/cv.service';
import { CvVisibilityService } from '../modules/cv/cv-visibility.service';
import {
  createCvSchema,
  listCvsQuerySchema,
  updateCvAttributeSchema,
  updateCvProjectsSchema
} from '../modules/cv/cv.schemas';
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

const attributesRepository = new AttributesRepository();
const recentAttributesService = new RecentAttributesService(attributesRepository);

const cvService = new CvService(
  cvRepository,
  cvGenerationService,
  cvVisibilityService,
  recentAttributesService
);

const cvController = new CvController(cvService);

router.use(requireAuth, rejectBlockedUsers);

router.get('/', validate(listCvsQuerySchema, 'query'), cvController.listCvs);
router.get('/:id', cvController.getCvById);
router.post('/', validate(createCvSchema), cvController.createCv);
router.patch('/:id/attributes', validate(updateCvAttributeSchema), cvController.updateCvAttribute);
router.patch('/:id/projects', validate(updateCvProjectsSchema), cvController.updateCvProjects);
router.post('/:id/publish', cvController.publishCv);
router.post('/:id/unpublish', cvController.unpublishCv);
router.delete('/:id', cvController.deleteCv);

export const cvRouter = router;
