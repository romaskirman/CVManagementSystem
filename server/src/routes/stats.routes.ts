import { Router } from 'express';
import { StatsRepository } from '../modules/stats/stats.repository';
import { StatsService } from '../modules/stats/stats.service';
import { StatsController } from '../modules/stats/stats.controller';

const router = Router();

const statsRepository = new StatsRepository();
const statsService = new StatsService(statsRepository);
const statsController = new StatsController(statsService);

router.get('/public', statsController.getPublicStats);
router.get('/latest-positions', statsController.getLatestPositions);
router.get('/popular-positions', statsController.getMostPopularPositions);
router.get('/tag-cloud', statsController.getTagCloud);

export const statsRouter = router;
