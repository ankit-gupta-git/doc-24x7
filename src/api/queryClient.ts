import { QueryClient } from '@tanstack/react-query';

import { ApiError } from './client';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Don't retry client errors (404, 403…); retry network and server errors twice.
      retry: (count, err) => !(err instanceof ApiError && err.status < 500) && count < 2,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: false },
  },
});
