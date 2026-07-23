import { NextFunction, Request, RequestHandler, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { SearchService } from './search.service';
import { GlobalSearchQuery } from './search.types';
import { RequestUser } from '../../common/types/request-user.type';

export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  globalSearch: RequestHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const currentUser = req.user as RequestUser | undefined;
      const query = req.query as unknown as GlobalSearchQuery;
      const result = await this.searchService.globalSearch(query, currentUser);

      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  };
}
