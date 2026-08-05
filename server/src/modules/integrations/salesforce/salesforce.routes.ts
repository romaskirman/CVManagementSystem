import { Router } from 'express';
import { requireAuth } from '../../../middlewares/auth.middleware';
import { SalesforceClient } from './salesforce.client';
import { SalesforceController } from './salesforce.controller';
import { SalesforceService } from './salesforce.service';
import { UsersRepository } from '../../users/users.repository';

const router = Router();

const salesforceClient = new SalesforceClient({
  loginUrl: process.env.SALESFORCE_LOGIN_URL ?? 'https://login.salesforce.com',
  clientId: process.env.SALESFORCE_CLIENT_ID ?? '',
  clientSecret: process.env.SALESFORCE_CLIENT_SECRET ?? '',
  refreshToken: process.env.SALESFORCE_REFRESH_TOKEN ?? '',
  apiVersion: process.env.SALESFORCE_API_VERSION ?? '65.0',
  onRefreshToken: async (refreshToken) => {
    console.log('[Salesforce] latest refresh token', refreshToken);
  }
});

const usersRepository = new UsersRepository();
const salesforceService = new SalesforceService(salesforceClient, usersRepository);
const salesforceController = new SalesforceController(salesforceService);

router.use(requireAuth);

router.post('/export/me', salesforceController.exportCurrentUser);

export const salesforceRouter = router;
