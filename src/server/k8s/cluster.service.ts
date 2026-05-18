/**
 * Cluster service — fetches and normalizes Kubernetes resources.
 *
 * All methods return normalized types from `@/types/kubernetes`
 * rather than raw K8s API responses for consistent client consumption.
 */
import { coreV1Api, appsV1Api } from './client';
import type {
  NamespaceResource,
  PodResource,
  DeploymentResource,
  NodeResource,
  ContainerStatus,
  ContainerState,
  PodPhase,
} from '@/types/kubernetes';

function parseContainerState(
  state: { running?: object; waiting?: { reason?: string }; terminated?: { reason?: string } } | undefined
): { state: ContainerState; reason?: string } {
  if (!state) return { state: 'waiting' };
  if (state.running) return { state: 'running' };
  if (state.terminated) return { state: 'terminated', reason: state.terminated.reason };
  if (state.waiting) return { state: 'waiting', reason: state.waiting.reason };
  return { state: 'waiting' };
}

export const clusterService = {
  /** List all namespaces in the cluster */
  async listNamespaces(): Promise<NamespaceResource[]> {
    const res = await coreV1Api.listNamespace();
    return (res.items || []).map((ns) => ({
      name: ns.metadata?.name || '',
      status: (ns.status?.phase as 'Active' | 'Terminating') || 'Active',
      labels: ns.metadata?.labels || {},
      createdAt: ns.metadata?.creationTimestamp?.toISOString() || '',
    }));
  },

  /** List pods in a namespace, optionally filtered by label selector */
  async listPods(namespace: string, labelSelector?: string): Promise<PodResource[]> {
    const res = await coreV1Api.listNamespacedPod({
      namespace,
      labelSelector,
    });
    return (res.items || []).map((pod) => {
      const containerStatuses = (pod.status?.containerStatuses || []).map((cs): ContainerStatus => {
        const { state, reason } = parseContainerState(cs.state as Parameters<typeof parseContainerState>[0]);
        return {
          name: cs.name,
          ready: cs.ready,
          restartCount: cs.restartCount,
          state,
          stateReason: reason,
          image: cs.image,
        };
      });

      const totalRestarts = containerStatuses.reduce((sum, c) => sum + c.restartCount, 0);

      return {
        name: pod.metadata?.name || '',
        namespace: pod.metadata?.namespace || namespace,
        phase: (pod.status?.phase as PodPhase) || 'Unknown',
        nodeName: pod.spec?.nodeName || null,
        podIP: pod.status?.podIP || null,
        hostIP: pod.status?.hostIP || null,
        startTime: pod.status?.startTime?.toISOString() || null,
        containers: containerStatuses,
        restartCount: totalRestarts,
        labels: pod.metadata?.labels || {},
        annotations: pod.metadata?.annotations || {},
        createdAt: pod.metadata?.creationTimestamp?.toISOString() || '',
        conditions: (pod.status?.conditions || []).map((c) => ({
          type: c.type,
          status: c.status as 'True' | 'False' | 'Unknown',
          reason: c.reason,
          message: c.message,
          lastTransitionTime: c.lastTransitionTime?.toISOString(),
        })),
      };
    });
  },

  /** List deployments in a namespace */
  async listDeployments(namespace: string): Promise<DeploymentResource[]> {
    const res = await appsV1Api.listNamespacedDeployment({ namespace });
    return (res.items || []).map((dep) => ({
      name: dep.metadata?.name || '',
      namespace: dep.metadata?.namespace || namespace,
      replicas: dep.spec?.replicas || 0,
      readyReplicas: dep.status?.readyReplicas || 0,
      updatedReplicas: dep.status?.updatedReplicas || 0,
      availableReplicas: dep.status?.availableReplicas || 0,
      strategy: dep.spec?.strategy?.type || 'RollingUpdate',
      labels: dep.metadata?.labels || {},
      conditions: (dep.status?.conditions || []).map((c) => ({
        type: c.type,
        status: c.status as 'True' | 'False' | 'Unknown',
        reason: c.reason,
        message: c.message,
        lastTransitionTime: c.lastTransitionTime?.toISOString(),
      })),
      createdAt: dep.metadata?.creationTimestamp?.toISOString() || '',
    }));
  },

  /** List all nodes in the cluster */
  async listNodes(): Promise<NodeResource[]> {
    const res = await coreV1Api.listNode();
    return (res.items || []).map((node) => {
      const readyCondition = (node.status?.conditions || []).find((c) => c.type === 'Ready');
      const roles = Object.keys(node.metadata?.labels || {})
        .filter((k) => k.startsWith('node-role.kubernetes.io/'))
        .map((k) => k.replace('node-role.kubernetes.io/', ''));

      return {
        name: node.metadata?.name || '',
        status: readyCondition?.status === 'True' ? 'Ready' : 'NotReady',
        roles: roles.length > 0 ? roles : ['worker'],
        kubeletVersion: node.status?.nodeInfo?.kubeletVersion || '',
        osImage: node.status?.nodeInfo?.osImage || '',
        architecture: node.status?.nodeInfo?.architecture || '',
        capacity: {
          cpu: node.status?.capacity?.cpu || '0',
          memory: node.status?.capacity?.memory || '0',
          pods: node.status?.capacity?.pods || '0',
        },
        allocatable: {
          cpu: node.status?.allocatable?.cpu || '0',
          memory: node.status?.allocatable?.memory || '0',
          pods: node.status?.allocatable?.pods || '0',
        },
        conditions: (node.status?.conditions || []).map((c) => ({
          type: c.type || '',
          status: c.status as 'True' | 'False' | 'Unknown',
          reason: c.reason,
          message: c.message,
          lastHeartbeatTime: c.lastHeartbeatTime?.toISOString(),
        })),
        taints: (node.spec?.taints || []).map((t) => ({
          key: t.key || '',
          value: t.value,
          effect: t.effect as 'NoSchedule' | 'PreferNoSchedule' | 'NoExecute',
        })),
        labels: node.metadata?.labels || {},
        createdAt: node.metadata?.creationTimestamp?.toISOString() || '',
      };
    });
  },
};
