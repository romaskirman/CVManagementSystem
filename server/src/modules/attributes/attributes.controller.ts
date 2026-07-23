import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AttributesService } from './attributes.service';
import { RequestUser } from '../../common/types/request-user.type';

type AttributeIdParams = {
  id: string;
};

export class AttributesController {
  constructor(private readonly attributesService: AttributesService) {}

  listAttributes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUser = req.user as RequestUser | undefined;
      const result = await this.attributesService.listAttributes(
        req.query,
        currentUser?.id
      );

      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  };

  getAttributeById = async (
    req: Request<AttributeIdParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const currentUser = req.user as RequestUser | undefined;
      const result = await this.attributesService.getAttributeById(
        req.params.id,
        currentUser?.id
      );

      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  };

  createAttribute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUser = req.user as RequestUser;
      const result = await this.attributesService.createAttribute(req.body, currentUser);
      res.status(StatusCodes.CREATED).json(result);
    } catch (error) {
      next(error);
    }
  };

  updateAttribute = async (
    req: Request<AttributeIdParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const currentUser = req.user as RequestUser;
      const result = await this.attributesService.updateAttribute(req.params.id, req.body, currentUser);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  };

  deleteAttribute = async (
    req: Request<AttributeIdParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const currentUser = req.user as RequestUser;
      const result = await this.attributesService.deleteAttribute(req.params.id, currentUser);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  };

  markAsUsed = async (
    req: Request<AttributeIdParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const currentUser = req.user as RequestUser;
      const result = await this.attributesService.markAsUsed(currentUser.id, req.params.id);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  };
}
