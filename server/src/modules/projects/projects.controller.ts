import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ProjectsService } from './projects.service';
import { RequestUser } from '../../common/types/request-user.type';

type ProjectIdParams = {
  projectId: string;
};

type UserIdParams = {
  userId: string;
};

export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  listMyProjects = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUser = req.user as RequestUser;
      const result = await this.projectsService.listMyProjects(currentUser.id);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  };

  createMyProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUser = req.user as RequestUser;
      const result = await this.projectsService.createMyProject(currentUser.id, req.body);
      res.status(StatusCodes.CREATED).json(result);
    } catch (error) {
      next(error);
    }
  };

  updateMyProject = async (
    req: Request<ProjectIdParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const currentUser = req.user as RequestUser;
      const result = await this.projectsService.updateMyProject(
        currentUser.id,
        req.params.projectId,
        req.body
      );
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  };

  deleteMyProject = async (
    req: Request<ProjectIdParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const currentUser = req.user as RequestUser;
      const result = await this.projectsService.deleteMyProject(
        currentUser.id,
        req.params.projectId
      );
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  };

  listProjectsForUser = async (
    req: Request<UserIdParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const currentUser = req.user as RequestUser;
      const result = await this.projectsService.listProjectsForUser(
        req.params.userId,
        currentUser.id,
        currentUser.roles.map(String)
      );
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  };

  suggestTags = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.projectsService.suggestTags(String(req.query.query));
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  };
}
