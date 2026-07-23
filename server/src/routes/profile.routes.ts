import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { rejectBlockedUsers } from '../middlewares/blocked-user.middleware';
import { validate } from '../middlewares/validate.middleware';
import { AttributesRepository } from '../modules/attributes/attributes.repository';
import { RecentAttributesService } from '../modules/attributes/recent-attributes.service';
import { ProfileRepository } from '../modules/profile/profile.repository';
import { ProfilePermissionsService } from '../modules/profile/profile-permissions.service';
import { ProfileAutosaveService } from '../modules/profile/profile-autosave.service';
import { ProfileService } from '../modules/profile/profile.service';
import { ProfileController } from '../modules/profile/profile.controller';
import { updateProfileSchema, upsertProfileAttributeSchema } from '../modules/profile/profile.schemas';

const router = Router();

const profileRepository = new ProfileRepository();
const profilePermissionsService = new ProfilePermissionsService();
const profileAutosaveService = new ProfileAutosaveService();
const attributesRepository = new AttributesRepository();
const recentAttributesService = new RecentAttributesService(attributesRepository);

const profileService = new ProfileService(
  profileRepository,
  profilePermissionsService,
  profileAutosaveService,
  recentAttributesService
);

const profileController = new ProfileController(profileService);

router.use(requireAuth, rejectBlockedUsers);

router.get('/me', profileController.getMyProfile);
router.patch('/me', validate(updateProfileSchema), profileController.updateMyProfile);
router.put(
  '/me/attributes/:attributeId',
  validate(upsertProfileAttributeSchema),
  profileController.upsertMyProfileAttribute
);
router.delete('/me/attributes/:attributeId', profileController.deleteMyProfileAttribute);
router.get('/:userId', profileController.getPublicProfile);

export const profileRouter = router;
