import { StatusCodes } from 'http-status-codes';
import { AppError } from './AppError';

export class ConflictError extends AppError {
  constructor(message = 'Conflict', details?: unknown) {
    super(message, StatusCodes.CONFLICT, 'CONFLICT', details);
    this.name = 'ConflictError';
  }
}
