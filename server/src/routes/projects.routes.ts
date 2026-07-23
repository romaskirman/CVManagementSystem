import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { rejectBlockedUsers } from '../middlewares/blocked-user.middleware';
import { validate } from '../middlewares/validate.middleware';
import { ProjectsRepository } from '../modules/projects/projects.repository';
import { TagsService } from '../modules/projects/tags.service';
import { ProjectsService } from '../modules/projects/projects.service';
import { ProjectsController } from '../modules/projects/projects.controller';
import {
  createProjectSchema,
  tagSuggestionsQuerySchema,
  updateProjectSchema
} from '../modules/projects/projects.schemas';

const router = Router();

const projectsRepository = new ProjectsRepository();
const tagsService = new TagsService(projectsRepository);
const projectsService = new ProjectsService(projectsRepository, tagsService);
const projectsController = new ProjectsController(projectsService);

router.use(requireAuth, rejectBlockedUsers);

router.get('/me', projectsController.listMyProjects);
router.post('/me', validate(createProjectSchema), projectsController.createMyProject);
router.patch('/me/:projectId', validate(updateProjectSchema), projectsController.updateMyProject);
router.delete('/me/:projectId', projectsController.deleteMyProject);
router.get('/user/:userId', projectsController.listProjectsForUser);
router.get('/tags/suggest', validate(tagSuggestionsQuerySchema, 'query'), projectsController.suggestTags);

export const projectsRouter = router;
