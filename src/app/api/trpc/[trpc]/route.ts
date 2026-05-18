/**
 * tRPC API route handler for Next.js App Router.
 *
 * Bridges the tRPC router to Next.js route handlers using the fetch adapter.
 */
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/routers';
import { createTRPCContext } from '@/server/trpc';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: createTRPCContext,
  });

export { handler as GET, handler as POST };
