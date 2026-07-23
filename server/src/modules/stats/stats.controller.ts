import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { RequestUser } from '../../common/types/request-user.type';
import { StatsService } from './stats.service';

export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  getPublicStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.statsService.getPublicStats();
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  };

  getLatestPositions = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.statsService.getLatestPositions();
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  };

  getMostPopularPositions = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.statsService.getMostPopularPositions();
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  };

  getTagCloud = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUser = req.user as RequestUser | undefined;
      const result = await this.statsService.getTagCloud(currentUser);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  };
}
