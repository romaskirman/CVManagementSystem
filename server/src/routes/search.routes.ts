import { Router } from 'express';
import { optionalAuth } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { SearchController } from '../modules/search/search.controller';
import { SearchRepository } from '../modules/search/search.repository';
import { SearchService } from '../modules/search/search.service';
import { globalSearchQuerySchema } from '../modules/search/search.schemas';

const router = Router();

const searchRepository = new SearchRepository();
const searchService = new SearchService(searchRepository);
const searchController = new SearchController(searchService);

router.get('/', optionalAuth, validate(globalSearchQuerySchema, 'query'), searchController.globalSearch);

export const searchRouter = router;
