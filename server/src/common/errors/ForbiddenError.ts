import { StatusCodes } from 'http-status-codes';
import { AppError } from './AppError';

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', details?: unknown) {
    super(message, StatusCodes.FORBIDDEN, 'FORBIDDEN', details);
    this.name = 'ForbiddenError';
  }
}
