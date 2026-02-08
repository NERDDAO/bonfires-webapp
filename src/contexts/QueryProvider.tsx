"use client";

import { type ReactNode, useState } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
            retry: 3,
            retryDelay: (attemptIndex) =>
              Math.min(1000 * 2 ** attemptIndex, 30000),
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-left"
        />
      )}
    </QueryClientProvider>
  );
}
