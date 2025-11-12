import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: (failureCount, error) => {
        if (error instanceof Error && 'isAuthError' in error) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});
