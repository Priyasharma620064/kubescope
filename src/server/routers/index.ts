/**
 * Root tRPC app router — merges all sub-routers into a single API surface.
 */
import { router } from '../trpc';
import { clusterRouter } from './cluster';
import { metricsRouter } from './metrics';
import { yamlRouter } from './yaml';

export const appRouter = router({
  cluster: clusterRouter,
  metrics: metricsRouter,
  yaml: yamlRouter,
});

/** Export the router type for client-side type inference */
export type AppRouter = typeof appRouter;
