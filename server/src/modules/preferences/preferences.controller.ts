import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { PreferencesService } from './preferences.service';
import { RequestUser } from '../../common/types/request-user.type';

export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  getMyPreferences = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUser = req.user as RequestUser;
      const result = await this.preferencesService.getMyPreferences(currentUser.id);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  };

  updateMyPreferences = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUser = req.user as RequestUser;
      const result = await this.preferencesService.updateMyPreferences(currentUser.id, req.body);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  };
}
