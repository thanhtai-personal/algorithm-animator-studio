import { useQuery } from '@tanstack/react-query';
import { fetchResetVersion } from '../services/fetchResetVersion';

export function useResetVersionQuery() {
  return useQuery({
    queryKey: ['resetVersion'],
    queryFn: fetchResetVersion,
  });
}
