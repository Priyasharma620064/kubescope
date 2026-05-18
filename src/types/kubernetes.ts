/**
 * Shared Kubernetes type definitions used across client and server.
 * These provide a normalized interface over raw K8s API responses.
 */

// ─── Pod Types ───────────────────────────────────────────────

export type PodPhase = 'Pending' | 'Running' | 'Succeeded' | 'Failed' | 'Unknown';

export type ContainerState = 'running' | 'waiting' | 'terminated';

export interface ContainerStatus {
  name: string;
  ready: boolean;
  restartCount: number;
  state: ContainerState;
  stateReason?: string;
  image: string;
}

export interface PodResource {
  name: string;
  namespace: string;
  phase: PodPhase;
  nodeName: string | null;
  podIP: string | null;
  hostIP: string | null;
  startTime: string | null;
  containers: ContainerStatus[];
  restartCount: number;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  createdAt: string;
  conditions: PodCondition[];
}

export interface PodCondition {
  type: string;
  status: 'True' | 'False' | 'Unknown';
  reason?: string;
  message?: string;
  lastTransitionTime?: string;
}

// ─── Deployment Types ────────────────────────────────────────

export interface DeploymentResource {
  name: string;
  namespace: string;
  replicas: number;
  readyReplicas: number;
  updatedReplicas: number;
  availableReplicas: number;
  strategy: string;
  labels: Record<string, string>;
  conditions: DeploymentCondition[];
  createdAt: string;
}

export interface DeploymentCondition {
  type: string;
  status: 'True' | 'False' | 'Unknown';
  reason?: string;
  message?: string;
  lastTransitionTime?: string;
}

// ─── Node Types ──────────────────────────────────────────────

export interface NodeResource {
  name: string;
  status: 'Ready' | 'NotReady' | 'Unknown';
  roles: string[];
  kubeletVersion: string;
  osImage: string;
  architecture: string;
  capacity: ResourceAllocation;
  allocatable: ResourceAllocation;
  conditions: NodeCondition[];
  taints: NodeTaint[];
  labels: Record<string, string>;
  createdAt: string;
}

export interface ResourceAllocation {
  cpu: string;
  memory: string;
  pods: string;
}

export interface NodeCondition {
  type: string;
  status: 'True' | 'False' | 'Unknown';
  reason?: string;
  message?: string;
  lastHeartbeatTime?: string;
}

export interface NodeTaint {
  key: string;
  value?: string;
  effect: 'NoSchedule' | 'PreferNoSchedule' | 'NoExecute';
}

// ─── Namespace Types ─────────────────────────────────────────

export interface NamespaceResource {
  name: string;
  status: 'Active' | 'Terminating';
  labels: Record<string, string>;
  createdAt: string;
}

// ─── Event Types ─────────────────────────────────────────────

export type EventSeverity = 'Normal' | 'Warning';

export interface ClusterEvent {
  name: string;
  namespace: string;
  type: EventSeverity;
  reason: string;
  message: string;
  involvedObject: {
    kind: string;
    name: string;
    namespace?: string;
  };
  firstTimestamp: string | null;
  lastTimestamp: string | null;
  count: number;
  source: string;
}

// ─── Metrics Types ───────────────────────────────────────────

export interface PodMetrics {
  name: string;
  namespace: string;
  containers: ContainerMetrics[];
  timestamp: string;
}

export interface ContainerMetrics {
  name: string;
  cpuUsage: string;       // e.g., "50m" (millicores)
  memoryUsage: string;    // e.g., "128Mi"
  cpuPercent?: number;
  memoryPercent?: number;
}

export interface NodeMetrics {
  name: string;
  cpuUsage: string;
  memoryUsage: string;
  cpuPercent: number;
  memoryPercent: number;
  timestamp: string;
}

// ─── Cluster Summary ─────────────────────────────────────────

export interface ClusterSummary {
  totalPods: number;
  runningPods: number;
  pendingPods: number;
  failedPods: number;
  totalNodes: number;
  readyNodes: number;
  totalDeployments: number;
  totalNamespaces: number;
  warningEvents: number;
}

// ─── Diagnostic Types ────────────────────────────────────────

export type DiagnosticSeverity = 'critical' | 'warning' | 'info';

export interface DiagnosticResult {
  id: string;
  severity: DiagnosticSeverity;
  category: string;
  finding: string;
  evidence: string[];
  suggestion: string;
  affectedResources: string[];
  timestamp: string;
}

// ─── Log Types ───────────────────────────────────────────────

export type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'TRACE' | 'UNKNOWN';

export interface LogEntry {
  timestamp: string;
  content: string;
  level: LogLevel;
  lineNumber: number;
}

export interface LogStreamOptions {
  namespace: string;
  pod: string;
  container: string;
  tailLines?: number;
  previous?: boolean;
  timestamps?: boolean;
}
