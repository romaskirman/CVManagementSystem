import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { rejectBlockedUsers } from '../middlewares/blocked-user.middleware';
import { validate } from '../middlewares/validate.middleware';
import { PreferencesRepository } from '../modules/preferences/preferences.repository';
import { PreferencesService } from '../modules/preferences/preferences.service';
import { PreferencesController } from '../modules/preferences/preferences.controller';
import { updatePreferencesSchema } from '../modules/preferences/preferences.schemas';

const router = Router();

const preferencesRepository = new PreferencesRepository();
const preferencesService = new PreferencesService(preferencesRepository);
const preferencesController = new PreferencesController(preferencesService);

router.use(requireAuth, rejectBlockedUsers);

router.get('/me', preferencesController.getMyPreferences);
router.patch('/me', validate(updatePreferencesSchema), preferencesController.updateMyPreferences);

export const preferencesRouter = router;
