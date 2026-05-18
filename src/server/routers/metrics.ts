import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { liveMetricsService } from '../k8s/metrics.service';
import { demoMetricsService } from '../k8s/demo/metrics.demo';
import { isDemoMode } from '../k8s/service-factory';

function getService() {
  return isDemoMode() ? demoMetricsService : liveMetricsService;
}

export const metricsRouter = router({
  /** Fetch real-time metrics for all nodes in the cluster */
  nodeMetrics: publicProcedure.query(async () => {
    return getService().listNodeMetrics();
  }),

  /** Fetch metrics for all pods in a namespace */
  podMetrics: publicProcedure
    .input(z.object({ namespace: z.string() }))
    .query(async ({ input }) => {
      return getService().listPodMetrics(input.namespace);
    }),

  /** Fetch the unified cluster resource utilization summary */
  clusterSummary: publicProcedure.query(async () => {
    return getService().getClusterSummary();
  }),

  /** Fetch a 20-point historical timeline to seed time-series charts */
  historicalMetrics: publicProcedure
    .input(z.object({ points: z.number().optional().default(20) }))
    .query(async ({ input }) => {
      // Historical time-series is pre-generated dynamically by the demo metrics service
      return demoMetricsService.getHistoricalMetrics(input.points);
    }),
});
