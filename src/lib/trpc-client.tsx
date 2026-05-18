'use client';

/**
 * tRPC React client setup with React Query integration.
 *
 * Exports:
 * - `trpc` — typed tRPC hooks for client components
 * - `TRPCProvider` — wraps the app with QueryClient + tRPC providers
 */
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@/server/routers';

/** Typed tRPC hooks — use in client components */
export const trpc = createTRPCReact<AppRouter>();

function getBaseUrl() {
  if (typeof window !== 'undefined') return '';
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

/**
 * Provider component that wraps the app with tRPC + React Query.
 * Place in root layout.
 */
export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 5_000,
          },
        },
      })
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
