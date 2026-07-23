import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { DiscussionsService } from './discussions.service';
import { RequestUser } from '../../common/types/request-user.type';

type PositionIdParams = {
  positionId: string;
};

export class DiscussionsController {
  constructor(private readonly discussionsService: DiscussionsService) {}

  listPosts = async (
    req: Request<PositionIdParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const currentUser = req.user as RequestUser;
      const result = await this.discussionsService.listPosts(
        req.params.positionId,
        req.query,
        currentUser
      );
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  };

  createPost = async (
    req: Request<PositionIdParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const currentUser = req.user as RequestUser;
      const result = await this.discussionsService.createPost(
        req.params.positionId,
        req.body,
        currentUser
      );
      res.status(StatusCodes.CREATED).json(result);
    } catch (error) {
      next(error);
    }
  };

  getLatestActivity = async (
    req: Request<PositionIdParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const currentUser = req.user as RequestUser;
      const result = await this.discussionsService.getLatestActivity(
        req.params.positionId,
        currentUser
      );
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  };
}
