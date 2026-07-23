import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AdminService } from './admin.service';
import { RequestUser } from '../../common/types/request-user.type';

type UserIdParams = {
  userId: string;
};

export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  listUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUser = req.user as RequestUser;
      const result = await this.adminService.listUsers(req.query, currentUser);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  };

  getUserById = async (
    req: Request<UserIdParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const currentUser = req.user as RequestUser;
      const result = await this.adminService.getUserById(req.params.userId, currentUser);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  };

  createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUser = req.user as RequestUser;
      const result = await this.adminService.createUser(req.body, currentUser);
      res.status(StatusCodes.CREATED).json(result);
    } catch (error) {
      next(error);
    }
  };

  blockUser = async (
    req: Request<UserIdParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const currentUser = req.user as RequestUser;
      const result = await this.adminService.blockUser(req.params.userId, currentUser);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  };

  unblockUser = async (
    req: Request<UserIdParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const currentUser = req.user as RequestUser;
      const result = await this.adminService.unblockUser(req.params.userId, currentUser);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  };

  assignRole = async (
    req: Request<UserIdParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const currentUser = req.user as RequestUser;
      const result = await this.adminService.assignRole(req.params.userId, req.body, currentUser);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  };

  removeRole = async (
    req: Request<UserIdParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const currentUser = req.user as RequestUser;
      const result = await this.adminService.removeRole(req.params.userId, req.body, currentUser);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  };

  deleteUser = async (
    req: Request<UserIdParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const currentUser = req.user as RequestUser;
      const result = await this.adminService.deleteUser(req.params.userId, currentUser);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  };
}
