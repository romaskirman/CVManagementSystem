import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { PositionsService } from './positions.service';
import { RequestUser } from '../../common/types/request-user.type';

type PositionIdParams = {
  id: string;
};

export class PositionsController {
  constructor(private readonly positionsService: PositionsService) {}

  listPositions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUser = req.user as RequestUser | undefined;
      const result = await this.positionsService.listPositions(req.query, currentUser);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  };

  getPositionById = async (
    req: Request<PositionIdParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const currentUser = req.user as RequestUser | undefined;
      const result = await this.positionsService.getPositionById(req.params.id, currentUser);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  };

  createPosition = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUser = req.user as RequestUser;
      const result = await this.positionsService.createPosition(req.body, currentUser);
      res.status(StatusCodes.CREATED).json(result);
    } catch (error) {
      next(error);
    }
  };

  updatePosition = async (
    req: Request<PositionIdParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const currentUser = req.user as RequestUser;
      const result = await this.positionsService.updatePosition(req.params.id, req.body, currentUser);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  };

  deletePosition = async (
    req: Request<PositionIdParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const currentUser = req.user as RequestUser;
      const result = await this.positionsService.deletePosition(req.params.id, currentUser);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  };

  duplicatePosition = async (
    req: Request<PositionIdParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const currentUser = req.user as RequestUser;
      const result = await this.positionsService.duplicatePosition(req.params.id, currentUser);
      res.status(StatusCodes.CREATED).json(result);
    } catch (error) {
      next(error);
    }
  };
}
