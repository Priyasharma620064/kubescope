/**
 * Demo cluster service — returns synthetic Kubernetes data
 * for portfolio demos without requiring a live cluster.
 *
 * Data is designed to look realistic and exercise all UI states:
 * running, pending, failed, crashloopbackoff pods, healthy/unhealthy nodes, etc.
 */
import type {
  NamespaceResource,
  PodResource,
  DeploymentResource,
  NodeResource,
} from '@/types/kubernetes';

const NOW = new Date().toISOString();
const HOUR_AGO = new Date(Date.now() - 3600_000).toISOString();
const DAY_AGO = new Date(Date.now() - 86400_000).toISOString();
const WEEK_AGO = new Date(Date.now() - 604800_000).toISOString();

export const demoClusterService = {
  async listNamespaces(): Promise<NamespaceResource[]> {
    return [
      { name: 'default', status: 'Active', labels: {}, createdAt: WEEK_AGO },
      { name: 'kube-system', status: 'Active', labels: {}, createdAt: WEEK_AGO },
      { name: 'production', status: 'Active', labels: { env: 'production' }, createdAt: DAY_AGO },
      { name: 'staging', status: 'Active', labels: { env: 'staging' }, createdAt: DAY_AGO },
    ];
  },

  async listPods(namespace: string): Promise<PodResource[]> {
    const pods: Record<string, PodResource[]> = {
      default: [
        makePod('api-server-7d9f8b6c5-x2k4m', 'default', 'Running', 'node-1', 0),
        makePod('api-server-7d9f8b6c5-p8n3q', 'default', 'Running', 'node-2', 0),
        makePod('worker-batch-5c8d7e9f1-j6h2v', 'default', 'Running', 'node-1', 2),
      ],
      'kube-system': [
        makePod('coredns-5d78c9869d-4xk7p', 'kube-system', 'Running', 'node-1', 0),
        makePod('etcd-master', 'kube-system', 'Running', 'node-1', 0),
        makePod('kube-proxy-8h2jl', 'kube-system', 'Running', 'node-2', 1),
      ],
      production: [
        makePod('web-frontend-6b8c9d7e5-m3k9p', 'production', 'Running', 'node-2', 0),
        makePod('web-frontend-6b8c9d7e5-q7n2x', 'production', 'Running', 'node-1', 0),
        makePod('payment-svc-4a7b8c9d3-h5j8k', 'production', 'Running', 'node-2', 3),
        makePod('cache-redis-0', 'production', 'Running', 'node-1', 0),
        makePod('ml-pipeline-9e8d7c6b5-failed', 'production', 'Failed', 'node-2', 5, 'OOMKilled'),
        makePod('notification-svc-pending', 'production', 'Pending', null, 0, 'Insufficient memory'),
      ],
      staging: [
        makePod('staging-api-8f7e6d5c4-r2s9t', 'staging', 'Running', 'node-2', 0),
        makePod('staging-db-crashloop', 'staging', 'Running', 'node-1', 15, 'CrashLoopBackOff'),
        makePod('staging-worker-pending', 'staging', 'Pending', null, 0, 'Unschedulable'),
      ],
    };
    return pods[namespace] || [];
  },

  async listDeployments(namespace: string): Promise<DeploymentResource[]> {
    const deployments: Record<string, DeploymentResource[]> = {
      default: [
        makeDeployment('api-server', 'default', 2, 2),
        makeDeployment('worker-batch', 'default', 1, 1),
      ],
      production: [
        makeDeployment('web-frontend', 'production', 2, 2),
        makeDeployment('payment-svc', 'production', 1, 1),
        makeDeployment('ml-pipeline', 'production', 1, 0),
        makeDeployment('notification-svc', 'production', 1, 0),
      ],
      staging: [
        makeDeployment('staging-api', 'staging', 1, 1),
        makeDeployment('staging-db', 'staging', 1, 0),
      ],
      'kube-system': [
        makeDeployment('coredns', 'kube-system', 1, 1),
      ],
    };
    return deployments[namespace] || [];
  },

  async listNodes(): Promise<NodeResource[]> {
    return [
      {
        name: 'node-1',
        status: 'Ready',
        roles: ['control-plane', 'master'],
        kubeletVersion: 'v1.28.4',
        osImage: 'Ubuntu 22.04.3 LTS',
        architecture: 'amd64',
        capacity: { cpu: '4', memory: '16Gi', pods: '110' },
        allocatable: { cpu: '3800m', memory: '15Gi', pods: '110' },
        conditions: [
          { type: 'Ready', status: 'True', reason: 'KubeletReady', message: 'kubelet is posting ready status' },
          { type: 'MemoryPressure', status: 'False', reason: 'KubeletHasSufficientMemory' },
          { type: 'DiskPressure', status: 'False', reason: 'KubeletHasNoDiskPressure' },
          { type: 'PIDPressure', status: 'False', reason: 'KubeletHasSufficientPID' },
        ],
        taints: [{ key: 'node-role.kubernetes.io/control-plane', effect: 'NoSchedule' }],
        labels: { 'kubernetes.io/hostname': 'node-1', 'node-role.kubernetes.io/control-plane': '' },
        createdAt: WEEK_AGO,
      },
      {
        name: 'node-2',
        status: 'Ready',
        roles: ['worker'],
        kubeletVersion: 'v1.28.4',
        osImage: 'Ubuntu 22.04.3 LTS',
        architecture: 'amd64',
        capacity: { cpu: '8', memory: '32Gi', pods: '110' },
        allocatable: { cpu: '7800m', memory: '31Gi', pods: '110' },
        conditions: [
          { type: 'Ready', status: 'True', reason: 'KubeletReady', message: 'kubelet is posting ready status' },
          { type: 'MemoryPressure', status: 'False', reason: 'KubeletHasSufficientMemory' },
          { type: 'DiskPressure', status: 'False', reason: 'KubeletHasNoDiskPressure' },
          { type: 'PIDPressure', status: 'False', reason: 'KubeletHasSufficientPID' },
        ],
        taints: [],
        labels: { 'kubernetes.io/hostname': 'node-2' },
        createdAt: WEEK_AGO,
      },
      {
        name: 'node-3',
        status: 'NotReady',
        roles: ['worker'],
        kubeletVersion: 'v1.28.4',
        osImage: 'Ubuntu 22.04.3 LTS',
        architecture: 'amd64',
        capacity: { cpu: '4', memory: '8Gi', pods: '110' },
        allocatable: { cpu: '3800m', memory: '7Gi', pods: '110' },
        conditions: [
          { type: 'Ready', status: 'False', reason: 'KubeletNotReady', message: 'container runtime is down' },
          { type: 'MemoryPressure', status: 'True', reason: 'KubeletHasInsufficientMemory' },
          { type: 'DiskPressure', status: 'False', reason: 'KubeletHasNoDiskPressure' },
        ],
        taints: [{ key: 'node.kubernetes.io/not-ready', effect: 'NoSchedule' }],
        labels: { 'kubernetes.io/hostname': 'node-3' },
        createdAt: WEEK_AGO,
      },
    ];
  },
};

// ─── Helper Factories ────────────────────────────────────────

function makePod(
  name: string,
  namespace: string,
  phase: string,
  node: string | null,
  restarts: number,
  stateReason?: string
): PodResource {
  const isRunning = phase === 'Running';
  return {
    name,
    namespace,
    phase: phase as PodResource['phase'],
    nodeName: node,
    podIP: isRunning ? `10.244.${Math.floor(Math.random() * 5)}.${Math.floor(Math.random() * 255)}` : null,
    hostIP: node ? `192.168.1.${node === 'node-1' ? 10 : node === 'node-2' ? 11 : 12}` : null,
    startTime: isRunning ? HOUR_AGO : null,
    containers: [
      {
        name: name.split('-')[0],
        ready: isRunning,
        restartCount: restarts,
        state: isRunning ? 'running' : phase === 'Pending' ? 'waiting' : 'terminated',
        stateReason,
        image: `ghcr.io/org/${name.split('-')[0]}:latest`,
      },
    ],
    restartCount: restarts,
    labels: { app: name.split('-')[0], namespace },
    annotations: {},
    createdAt: DAY_AGO,
    conditions: [
      {
        type: 'Ready',
        status: isRunning ? 'True' : 'False',
        reason: isRunning ? 'ContainersReady' : stateReason || 'ContainersNotReady',
      },
    ],
  };
}

function makeDeployment(
  name: string,
  namespace: string,
  replicas: number,
  ready: number
): DeploymentResource {
  return {
    name,
    namespace,
    replicas,
    readyReplicas: ready,
    updatedReplicas: ready,
    availableReplicas: ready,
    strategy: 'RollingUpdate',
    labels: { app: name },
    conditions: [
      {
        type: 'Available',
        status: ready > 0 ? 'True' : 'False',
        reason: ready > 0 ? 'MinimumReplicasAvailable' : 'MinimumReplicasUnavailable',
        lastTransitionTime: NOW,
      },
      {
        type: 'Progressing',
        status: 'True',
        reason: 'NewReplicaSetAvailable',
        lastTransitionTime: NOW,
      },
    ],
    createdAt: DAY_AGO,
  };
}
