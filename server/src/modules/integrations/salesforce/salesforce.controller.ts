import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { RequestUser } from '../../../common/types/request-user.type';
import { SalesforceService } from './salesforce.service';
import { exportSalesforceProfileSchema } from './salesforce.schemas';

export class SalesforceController {
  constructor(private readonly salesforceService: SalesforceService) {}

  exportCurrentUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUser = req.user as RequestUser;
      const body = exportSalesforceProfileSchema.parse(req.body);

      const result = await this.salesforceService.exportCurrentUserToSalesforce(currentUser, body);

      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  };
}
