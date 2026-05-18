/**
 * Cluster tRPC router — exposes Kubernetes cluster data
 * via type-safe procedures for the frontend.
 */
import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { clusterService } from '../k8s/cluster.service';
import { demoClusterService } from '../k8s/demo/cluster.demo';
import { liveEventService } from '../k8s/event.service';
import { demoEventService } from '../k8s/demo/event.demo';
import { isDemoMode } from '../k8s/service-factory';

function getService() {
  return isDemoMode() ? demoClusterService : clusterService;
}

function getEventService() {
  return isDemoMode() ? demoEventService : liveEventService;
}

export const clusterRouter = router({
  /** List all namespaces */
  namespaces: publicProcedure.query(async () => {
    return getService().listNamespaces();
  }),

  /** List pods in a namespace with optional label filter */
  pods: publicProcedure
    .input(
      z.object({
        namespace: z.string(),
        labelSelector: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      return getService().listPods(input.namespace, input.labelSelector);
    }),

  /** List deployments in a namespace */
  deployments: publicProcedure
    .input(z.object({ namespace: z.string() }))
    .query(async ({ input }) => {
      return getService().listDeployments(input.namespace);
    }),

  /** List all nodes in the cluster */
  nodes: publicProcedure.query(async () => {
    return getService().listNodes();
  }),

  /** List all cluster/namespace events */
  events: publicProcedure
    .input(z.object({ namespace: z.string().optional() }))
    .query(async ({ input }) => {
      return getEventService().listEvents(input.namespace);
    }),

  /** Run diagnostic engine on a pod */
  diagnosePod: publicProcedure
    .input(z.object({ namespace: z.string(), podName: z.string() }))
    .query(async ({ input }) => {
      return getEventService().diagnosePod(input.namespace, input.podName);
    }),
});
