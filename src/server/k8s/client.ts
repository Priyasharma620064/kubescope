/**
 * Kubernetes client singleton.
 *
 * Loads kubeconfig from the default location (~/.kube/config or in-cluster SA).
 * Exports pre-configured API clients for different K8s resource groups.
 */
import * as k8s from '@kubernetes/client-node';

const kc = new k8s.KubeConfig();

try {
  kc.loadFromDefault();
} catch {
  console.warn(
    '[KubeScope] Failed to load kubeconfig. Running without cluster connection.'
  );
}

/** Core V1 API — pods, services, namespaces, events, nodes, configmaps */
export const coreV1Api = kc.makeApiClient(k8s.CoreV1Api);

/** Apps V1 API — deployments, statefulsets, daemonsets, replicasets */
export const appsV1Api = kc.makeApiClient(k8s.AppsV1Api);

/** Raw kubeconfig for advanced operations */
export const kubeConfig = kc;

/** Current cluster context name */
export function getCurrentContext(): string {
  try {
    return kc.getCurrentContext();
  } catch {
    return 'unknown';
  }
}
