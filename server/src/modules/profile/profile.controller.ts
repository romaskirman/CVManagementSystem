import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ProfileService } from './profile.service';
import { RequestUser } from '../../common/types/request-user.type';

type UserIdParams = {
  userId: string;
};

type AttributeIdParams = {
  attributeId: string;
};

export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  getMyProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUser = req.user as RequestUser;
      const result = await this.profileService.getMyProfile(currentUser.id);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  };

  getPublicProfile = async (
    req: Request<UserIdParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const currentUser = req.user as RequestUser;
      const result = await this.profileService.getPublicProfile(
        req.params.userId,
        currentUser.id,
        currentUser.roles.map(String)
      );
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  };

  updateMyProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUser = req.user as RequestUser;
      const result = await this.profileService.updateMyProfile(currentUser.id, req.body);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  };

  upsertMyProfileAttribute = async (
    req: Request<AttributeIdParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const currentUser = req.user as RequestUser;
      const result = await this.profileService.upsertMyProfileAttribute(currentUser.id, {
        ...req.body,
        attributeId: req.params.attributeId
      });

      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  };

  deleteMyProfileAttribute = async (
    req: Request<AttributeIdParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const currentUser = req.user as RequestUser;
      const result = await this.profileService.deleteMyProfileAttribute(
        currentUser.id,
        req.params.attributeId
      );

      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  };
}
