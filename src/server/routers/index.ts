/**
 * Root tRPC app router — merges all sub-routers into a single API surface.
 */
import { router } from '../trpc';
import { clusterRouter } from './cluster';

export const appRouter = router({
  cluster: clusterRouter,
});

/** Export the router type for client-side type inference */
export type AppRouter = typeof appRouter;
