import { ConflictError } from '../../common/errors/ConflictError';

export class ProfileAutosaveService {
  ensureProfileVersionUpdateSucceeded(updatedRowsCount: number): void {
    if (updatedRowsCount === 0) {
      throw new ConflictError('Profile version conflict detected');
    }
  }

  ensureAttributeVersionUpdateSucceeded(updated: unknown): void {
    if (!updated) {
      throw new ConflictError('Attribute value version conflict detected');
    }
  }
}
