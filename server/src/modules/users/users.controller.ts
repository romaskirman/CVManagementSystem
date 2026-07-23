import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { UsersService } from './users.service';
import { RequestUser } from '../../common/types/request-user.type';

type IdParams = {
  id: string;
};

export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  listUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.usersService.listUsers(req.query);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  };

  updateRoles = async (req: Request<IdParams>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUser = req.user as RequestUser;
      const result = await this.usersService.updateRoles(req.params.id, req.body, currentUser.id);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  };

  blockUser = async (req: Request<IdParams>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUser = req.user as RequestUser;
      const result = await this.usersService.blockUser(req.params.id, currentUser.id);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  };

  unblockUser = async (req: Request<IdParams>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.usersService.unblockUser(req.params.id);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  };

  deleteUser = async (req: Request<IdParams>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUser = req.user as RequestUser;
      const result = await this.usersService.deleteUser(req.params.id, currentUser.id);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  };
}
