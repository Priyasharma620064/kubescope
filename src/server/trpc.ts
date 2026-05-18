/**
 * tRPC server initialization.
 *
 * Sets up the tRPC instance with context creation and
 * exports the router and procedure builders.
 */
import { initTRPC } from '@trpc/server';

/**
 * Context available to all tRPC procedures.
 * Extended in future commits with auth, caching, etc.
 */
export function createTRPCContext() {
  return {};
}

type Context = ReturnType<typeof createTRPCContext>;

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape }) {
    return shape;
  },
});

/** Router builder */
export const router = t.router;

/** Public procedure — no auth required */
export const publicProcedure = t.procedure;
