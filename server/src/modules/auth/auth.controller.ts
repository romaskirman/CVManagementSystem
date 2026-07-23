import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AuthService } from './auth.service';
import { RequestUser } from '../../common/types/request-user.type';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.authService.register(req.body);

      req.login(user as Express.User, (error) => {
        if (error) {
          return next(error);
        }

        res.status(StatusCodes.CREATED).json({
          user
        });
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.authService.login(req.body);

      req.login(user as Express.User, (error) => {
        if (error) {
          return next(error);
        }

        res.status(StatusCodes.OK).json({
          user
        });
      });
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    req.logout((error) => {
      if (error) {
        return next(error);
      }

      req.session.destroy((sessionError) => {
        if (sessionError) {
          return next(sessionError);
        }

        res.clearCookie('cvms.sid');
        res.status(StatusCodes.OK).json({
          success: true
        });
      });
    });
  };

  me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(StatusCodes.OK).json({
          user: null
        });
        return;
      }

      const requestUser = req.user as RequestUser;
      const user = await this.authService.getCurrentUser(requestUser.id);

      res.status(StatusCodes.OK).json({
        user
      });
    } catch (error) {
      next(error);
    }
  };

  oauthSuccess = async (_req: Request, res: Response): Promise<void> => {
    res.redirect(`${process.env.CLIENT_URL ?? 'http://localhost:5173'}/auth/callback?success=1`);
  };

  oauthFailure = async (_req: Request, res: Response): Promise<void> => {
    res.redirect(`${process.env.CLIENT_URL ?? 'http://localhost:5173'}/login?oauthError=1`);
  };
}
