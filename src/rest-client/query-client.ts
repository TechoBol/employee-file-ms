import { QueryClient } from '@tanstack/react-query';
import type { ApiError } from './types/api.types';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: (failureCount, error: unknown) => {
        if (
          isApiError(error) &&
          typeof error.status === 'number' &&
          error.status >= 400 &&
          error.status < 500
        ) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

function isApiError(_error: unknown): _error is ApiError {
  return (
    typeof _error === 'object' &&
    _error !== null &&
    'status' in _error &&
    'message' in _error
  );
}
