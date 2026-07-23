import { StatusCodes } from 'http-status-codes';
import { AppError } from './AppError';

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details?: unknown) {
    super(message, StatusCodes.NOT_FOUND, 'NOT_FOUND', details);
    this.name = 'NotFoundError';
  }
}
