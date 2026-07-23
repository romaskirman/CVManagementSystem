import { ConflictError } from '../common/errors/ConflictError';

export function assertVersionMatch(currentVersion: number, incomingVersion: number): void {
  if (currentVersion !== incomingVersion) {
    throw new ConflictError('Version conflict detected', {
      currentVersion,
      incomingVersion
    });
  }
}
