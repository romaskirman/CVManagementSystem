import { StatusCodes } from 'http-status-codes';
import { AppError } from './AppError';

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: unknown) {
    super(message, StatusCodes.BAD_REQUEST, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}
