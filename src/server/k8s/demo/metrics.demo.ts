import { NodeMetrics, PodMetrics, ClusterSummary } from '@/types/kubernetes';
import { demoClusterService } from './cluster.demo';

export interface HistoricalDataPoint {
  timestamp: string;
  cpuUsed: number;       // Average cluster CPU %
  memoryUsed: number;    // Average cluster Mem %
  schedulerLatency: number; // in ms
  restarts: number;
}

export const demoMetricsService = {
  async listNodeMetrics(): Promise<NodeMetrics[]> {
    // Generate slightly fluctuating values around targeted averages
    const now = new Date().toISOString();
    
    // node-1 (control-plane): ~30% CPU, ~50% Memory
    const node1Cpu = Math.round(30 + Math.random() * 5);
    const node1Mem = Math.round(50 + Math.random() * 3);

    // node-2 (worker-1): ~65% CPU, ~72% Memory
    const node2Cpu = Math.round(65 + Math.random() * 8);
    const node2Mem = Math.round(72 + Math.random() * 4);

    // node-3 (NotReady worker): ~85% CPU, ~92% Memory (MemoryPressure)
    const node3Cpu = Math.round(85 + Math.random() * 4);
    const node3Mem = Math.round(92 + Math.random() * 2);

    return [
      {
        name: 'node-1',
        cpuUsage: `${Math.round(3800 * (node1Cpu / 100))}m`,
        memoryUsage: `${Math.round(15 * (node1Mem / 100) * 1024)}Mi`,
        cpuPercent: node1Cpu,
        memoryPercent: node1Mem,
        timestamp: now,
      },
      {
        name: 'node-2',
        cpuUsage: `${Math.round(7800 * (node2Cpu / 100))}m`,
        memoryUsage: `${Math.round(31 * (node2Mem / 100) * 1024)}Mi`,
        cpuPercent: node2Cpu,
        memoryPercent: node2Mem,
        timestamp: now,
      },
      {
        name: 'node-3',
        cpuUsage: `${Math.round(3800 * (node3Cpu / 100))}m`,
        memoryUsage: `${Math.round(7 * (node3Mem / 100) * 1024)}Mi`,
        cpuPercent: node3Cpu,
        memoryPercent: node3Mem,
        timestamp: now,
      },
    ];
  },

  async listPodMetrics(namespace: string): Promise<PodMetrics[]> {
    const now = new Date().toISOString();
    const pods = await demoClusterService.listPods(namespace);

    return pods.map(pod => {
      const isRunning = pod.phase === 'Running';
      const containers = pod.containers.map(c => {
        // Active pods consume resources, other statuses are near-zero
        const baseCpu = isRunning ? (pod.name.includes('web') ? 120 : pod.name.includes('payment') ? 250 : 80) : 0;
        const baseMem = isRunning ? (pod.name.includes('web') ? 180 : pod.name.includes('payment') ? 450 : 120) : 0;

        const cpu = isRunning ? Math.round(baseCpu + Math.random() * 30) : 0;
        const mem = isRunning ? Math.round(baseMem + Math.random() * 20) : 0;

        return {
          name: c.name,
          cpuUsage: `${cpu}m`,
          memoryUsage: `${mem}Mi`,
          cpuPercent: 0,
          memoryPercent: 0,
        };
      });

      return {
        name: pod.name,
        namespace,
        containers,
        timestamp: now,
      };
    });
  },

  async getClusterSummary(): Promise<ClusterSummary> {
    const nodes = await demoClusterService.listNodes();
    const namespaces = await demoClusterService.listNamespaces();
    const allPods = await Promise.all(
      namespaces.map(ns => demoClusterService.listPods(ns.name))
    );
    const pods = allPods.flat();

    let totalDeployments = 0;
    for (const ns of namespaces) {
      const deps = await demoClusterService.listDeployments(ns.name);
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
      warningEvents: 4, // Preset warning events for visual alert styling on dashboard
    };
  },

  // Generates 20 historic data points ending at current time
  getHistoricalMetrics(pointsCount = 20): HistoricalDataPoint[] {
    const history: HistoricalDataPoint[] = [];
    const baseTime = Date.now();

    for (let i = pointsCount - 1; i >= 0; i--) {
      const timestamp = new Date(baseTime - i * 15000).toISOString(); // 15 seconds steps
      
      // Calculate realistic fluctuating metrics
      // Add a slight sine wave to CPU/Mem to look like traffic trends
      const wave = Math.sin((pointsCount - i) / 3);
      const cpuUsed = Math.round(55 + wave * 10 + Math.random() * 5);
      const memoryUsed = Math.round(68 + wave * 4 + Math.random() * 2);
      
      // Latency: control loop latency in ms, averages around 10-18ms with occasional small spikes
      const isSpike = Math.random() < 0.15;
      const schedulerLatency = isSpike 
        ? Math.round(45 + Math.random() * 50) 
        : Math.round(12 + Math.random() * 6);

      const restarts = Math.max(1, Math.round(2 + Math.sin((pointsCount - i) / 5) * 1.5));

      history.push({
        timestamp,
        cpuUsed,
        memoryUsed,
        schedulerLatency,
        restarts,
      });
    }

    return history;
  }
};
