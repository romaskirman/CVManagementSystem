import { StatusCodes } from 'http-status-codes';
import { AppError } from './AppError';

export class AuthError extends AppError {
  constructor(message = 'Unauthorized', details?: unknown) {
    super(message, StatusCodes.UNAUTHORIZED, 'AUTH_ERROR', details);
    this.name = 'AuthError';
  }
}
