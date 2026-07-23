import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { rejectBlockedUsers } from '../middlewares/blocked-user.middleware';
import { validate } from '../middlewares/validate.middleware';
import { AttributesRepository } from '../modules/attributes/attributes.repository';
import { AttributesService } from '../modules/attributes/attributes.service';
import { AttributesController } from '../modules/attributes/attributes.controller';
import {
  attributesQuerySchema,
  createAttributeSchema,
  updateAttributeSchema
} from '../modules/attributes/attributes.schemas';

const router = Router();

const attributesRepository = new AttributesRepository();
const attributesService = new AttributesService(attributesRepository);
const attributesController = new AttributesController(attributesService);

router.use(requireAuth, rejectBlockedUsers);

router.get('/', validate(attributesQuerySchema, 'query'), attributesController.listAttributes);
router.get('/:id', attributesController.getAttributeById);
router.post('/', validate(createAttributeSchema), attributesController.createAttribute);
router.patch('/:id', validate(updateAttributeSchema), attributesController.updateAttribute);
router.delete('/:id', attributesController.deleteAttribute);
router.post('/:id/use', attributesController.markAsUsed);

export const attributesRouter = router;
