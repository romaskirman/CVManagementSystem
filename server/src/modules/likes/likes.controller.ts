import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { LikesService } from './likes.service';
import { RequestUser } from '../../common/types/request-user.type';

type CvIdParams = {
  cvId: string;
};

export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  likeCv = async (
    req: Request<CvIdParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const currentUser = req.user as RequestUser;
      const result = await this.likesService.likeCv(req.params.cvId, currentUser);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  };

  unlikeCv = async (
    req: Request<CvIdParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const currentUser = req.user as RequestUser;
      const result = await this.likesService.unlikeCv(req.params.cvId, currentUser);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  };
}
