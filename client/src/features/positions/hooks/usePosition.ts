import { useQuery } from '@tanstack/react-query';
import { positionsApi } from '../../../shared/api/positions.api';

export function usePosition(positionId?: string) {
  return useQuery({
    queryKey: ['position', positionId],
    queryFn: () => positionsApi.getById(positionId!),
    enabled: Boolean(positionId)
  });
}
