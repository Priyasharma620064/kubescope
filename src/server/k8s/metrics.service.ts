import * as k8s from '@kubernetes/client-node';
import { kubeConfig } from './client';
import { NodeMetrics, PodMetrics, ClusterSummary } from '@/types/kubernetes';
import { clusterService } from './cluster.service';

const customObjectsApi = kubeConfig.makeApiClient(k8s.CustomObjectsApi);

export function parseCpu(cpuStr: string): number {
  if (!cpuStr) return 0;
  const match = cpuStr.trim().match(/^([0-9.]+)([a-zA-Z]*)$/);
  if (!match) return 0;
  const value = parseFloat(match[1]);
  const unit = match[2];
  
  if (unit === 'n') return value / 1_000_000;
  if (unit === 'u') return value / 1_000;
  if (unit === 'm') return value;
  return value * 1000;
}

export function parseMemory(memStr: string): number {
  if (!memStr) return 0;
  const match = memStr.trim().match(/^([0-9.]+)([a-zA-Z]*)$/);
  if (!match) return 0;
  const value = parseFloat(match[1]);
  const unit = match[2];
  
  if (unit === 'Ki' || unit === 'ki') return value / 1024;
  if (unit === 'Mi' || unit === 'mi') return value;
  if (unit === 'Gi' || unit === 'gi') return value * 1024;
  if (unit === 'Ti' || unit === 'ti') return value * 1024 * 1024;
  if (unit === 'k') return value / 1000;
  if (unit === 'm') return value;
  if (unit === 'g') return value * 1000;
  return value / (1024 * 1024);
}

interface K8sNodeMetricItem {
  metadata: { name: string };
  usage: { cpu: string; memory: string };
  timestamp: string;
}

interface K8sPodMetricItem {
  metadata: { name: string };
  containers: Array<{
    name: string;
    usage: { cpu: string; memory: string };
  }>;
  timestamp: string;
}

export class MetricsService {
  async listNodeMetrics(): Promise<NodeMetrics[]> {
    try {
      const metricsResponse = await customObjectsApi.listClusterCustomObject({
        group: 'metrics.k8s.io',
        version: 'v1beta1',
        plural: 'nodes',
      }) as { items: K8sNodeMetricItem[] };

      const nodes = await clusterService.listNodes();
      const nodeMap = new Map(nodes.map(n => [n.name, n]));

      return metricsResponse.items.map((item) => {
        const name = item.metadata.name;
        const cpuUsageStr = item.usage.cpu;
        const memoryUsageStr = item.usage.memory;
        const timestamp = item.timestamp;

        const cpuUsage = parseCpu(cpuUsageStr);
        const memoryUsage = parseMemory(memoryUsageStr);

        const node = nodeMap.get(name);
        let cpuPercent = 0;
        let memoryPercent = 0;

        if (node) {
          const cpuCapacity = parseCpu(node.allocatable.cpu);
          const memoryCapacity = parseMemory(node.allocatable.memory);
          cpuPercent = cpuCapacity > 0 ? (cpuUsage / cpuCapacity) * 100 : 0;
          memoryPercent = memoryCapacity > 0 ? (memoryUsage / memoryCapacity) * 100 : 0;
        }

        return {
          name,
          cpuUsage: `${Math.round(cpuUsage)}m`,
          memoryUsage: `${Math.round(memoryUsage)}Mi`,
          cpuPercent: Math.min(100, Math.round(cpuPercent)),
          memoryPercent: Math.min(100, Math.round(memoryPercent)),
          timestamp,
        };
      });
    } catch (err) {
      console.warn('[KubeScope] Failed to fetch node metrics from live cluster:', String(err));
      // Graceful fallback to static list
      const nodes = await clusterService.listNodes();
      return nodes.map(node => ({
        name: node.name,
        cpuUsage: '0m',
        memoryUsage: '0Mi',
        cpuPercent: 0,
        memoryPercent: 0,
        timestamp: new Date().toISOString(),
      }));
    }
  }

  async listPodMetrics(namespace: string): Promise<PodMetrics[]> {
    try {
      const metricsResponse = await customObjectsApi.listNamespacedCustomObject({
        group: 'metrics.k8s.io',
        version: 'v1beta1',
        namespace,
        plural: 'pods',
      }) as { items: K8sPodMetricItem[] };

      return metricsResponse.items.map((item) => {
        const name = item.metadata.name;
        const containers = item.containers.map((c) => {
          const cpu = parseCpu(c.usage.cpu);
          const mem = parseMemory(c.usage.memory);
          return {
            name: c.name,
            cpuUsage: `${Math.round(cpu)}m`,
            memoryUsage: `${Math.round(mem)}Mi`,
            cpuPercent: 0, // Individual pod container percentages are optional
            memoryPercent: 0,
          };
        });

        return {
          name,
          namespace,
          containers,
          timestamp: item.timestamp,
        };
      });
    } catch (err) {
      console.warn(`[KubeScope] Failed to fetch pod metrics for namespace ${namespace}:`, String(err));
      return [];
    }
  }

  async getClusterSummary(): Promise<ClusterSummary> {
    try {
      const nodes = await clusterService.listNodes();
      const namespaces = await clusterService.listNamespaces();
      const allPods = await Promise.all(
        namespaces.map(ns => clusterService.listPods(ns.name))
      );
      const pods = allPods.flat();

      let totalDeployments = 0;
      for (const ns of namespaces) {
        const deps = await clusterService.listDeployments(ns.name);
        totalDeployments += deps.length;
      }

      const totalPods = pods.length;
      const runningPods = pods.filter(p => p.phase === 'Running').length;
      const pendingPods = pods.filter(p => p.phase === 'Pending').length;
      const failedPods = pods.filter(p => p.phase === 'Failed').length;

      const totalNodes = nodes.length;
      const readyNodes = nodes.filter(n => n.status === 'Ready').length;

      return {
        totalPods,
        runningPods,
        pendingPods,
        failedPods,
        totalNodes,
        readyNodes,
        totalDeployments,
        totalNamespaces: namespaces.length,
        warningEvents: 0, // Default to 0, fetched/aggregated by timeline
      };
    } catch (err) {
      console.error('[KubeScope] Failed to construct cluster summary:', err);
      return {
        totalPods: 0,
        runningPods: 0,
        pendingPods: 0,
        failedPods: 0,
        totalNodes: 0,
        readyNodes: 0,
        totalDeployments: 0,
        totalNamespaces: 0,
        warningEvents: 0,
      };
    }
  }
}

export const liveMetricsService = new MetricsService();
