import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { CvService } from './cv.service';
import { RequestUser } from '../../common/types/request-user.type';

type CvIdParams = {
  id: string;
};

export class CvController {
  constructor(private readonly cvService: CvService) {}

  listCvs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUser = req.user as RequestUser;
      const result = await this.cvService.listCvs(req.query, currentUser);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  };

  getCvById = async (
    req: Request<CvIdParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const currentUser = req.user as RequestUser;
      const result = await this.cvService.getCvById(req.params.id, currentUser);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  };

  createCv = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUser = req.user as RequestUser;
      const result = await this.cvService.createCv(currentUser, req.body);
      res.status(StatusCodes.CREATED).json(result);
    } catch (error) {
      next(error);
    }
  };

  updateCvAttribute = async (
    req: Request<CvIdParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const currentUser = req.user as RequestUser;
      const result = await this.cvService.updateCvAttribute(req.params.id, currentUser, req.body);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  };

  updateCvProjects = async (
    req: Request<CvIdParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const currentUser = req.user as RequestUser;
      const result = await this.cvService.updateCvProjects(req.params.id, currentUser, req.body);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  };

  publishCv = async (
    req: Request<CvIdParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const currentUser = req.user as RequestUser;
      const result = await this.cvService.publishCv(req.params.id, currentUser);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  };

  unpublishCv = async (
    req: Request<CvIdParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const currentUser = req.user as RequestUser;
      const result = await this.cvService.unpublishCv(req.params.id, currentUser);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  };

  deleteCv = async (
    req: Request<CvIdParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const currentUser = req.user as RequestUser;
      const result = await this.cvService.deleteCv(req.params.id, currentUser);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  };
}
