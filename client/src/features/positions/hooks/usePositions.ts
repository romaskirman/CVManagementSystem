import { useQuery } from '@tanstack/react-query';
import { positionsApi } from '../../../shared/api/positions.api';

export function usePositions(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['positions', params],
    queryFn: () => positionsApi.list(params)
  });
}
