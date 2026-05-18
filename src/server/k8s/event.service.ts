import * as k8s from '@kubernetes/client-node';
import { kubeConfig } from './client';

const coreV1Api = kubeConfig.makeApiClient(k8s.CoreV1Api);

export interface ClusterEvent {
  id: string;
  type: 'Normal' | 'Warning';
  reason: string;
  message: string;
  source: string;
  resourceKind: string;
  resourceName: string;
  namespace: string;
  firstTimestamp: string;
  lastTimestamp: string;
  count: number;
}

export interface DiagnosticFinding {
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'error';
}

export interface DiagnosticEvidence {
  source: string;
  content: string;
}

export interface DiagnosticRemediation {
  description: string;
  commands: string[];
}

export interface PodDiagnosis {
  podName: string;
  namespace: string;
  status: 'Healthy' | 'Warning' | 'Critical';
  summary: string;
  findings: DiagnosticFinding[];
  evidence: DiagnosticEvidence[];
  remediation: DiagnosticRemediation[];
}

export class EventService {
  /** Fetch events from the active Kubernetes cluster */
  async listEvents(namespace?: string): Promise<ClusterEvent[]> {
    try {
      const response = namespace
        ? await coreV1Api.listNamespacedEvent({ namespace })
        : await coreV1Api.listEventForAllNamespaces();

      const items = response.items || [];

      return items.map(item => ({
        id: item.metadata?.uid || Math.random().toString(36).substr(2, 9),
        type: (item.type === 'Warning' ? 'Warning' : 'Normal') as 'Normal' | 'Warning',
        reason: item.reason || 'Unknown',
        message: item.message || '',
        source: item.source?.component || item.reportingComponent || 'Unknown',
        resourceKind: item.involvedObject?.kind || 'Pod',
        resourceName: item.involvedObject?.name || 'Unknown',
        namespace: item.involvedObject?.namespace || 'default',
        firstTimestamp: item.firstTimestamp?.toISOString() || item.metadata?.creationTimestamp?.toISOString() || new Date().toISOString(),
        lastTimestamp: item.lastTimestamp?.toISOString() || new Date().toISOString(),
        count: item.count || 1,
      })).sort((a, b) => new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime());
    } catch (err) {
      console.warn('[KubeScope] Failed to fetch events from live cluster:', String(err));
      return [];
    }
  }

  /** Run structural rule-based diagnostics on a pod */
  async diagnosePod(namespace: string, podName: string): Promise<PodDiagnosis> {
    try {
      // 1. Fetch Pod spec and status
      const pod = await coreV1Api.readNamespacedPod({ name: podName, namespace });

      const diagnosis: PodDiagnosis = {
        podName,
        namespace,
        status: 'Healthy',
        summary: 'All checks passed. Pod is running optimally.',
        findings: [],
        evidence: [],
        remediation: [],
      };

      // 2. Extract basic health indicators
      const phase = pod.status?.phase;
      const conditions = pod.status?.conditions || [];
      const containerStatuses = pod.status?.containerStatuses || [];

      // Evidence: Pod Phase and conditions
      diagnosis.evidence.push({
        source: 'Pod Status Phase',
        content: `Phase: ${phase || 'Unknown'}`
      });

      // 3. Diagnose Unschedulable / Pending States
      if (phase === 'Pending') {
        diagnosis.status = 'Warning';
        diagnosis.summary = 'Pod is stuck in Pending status. Investigating scheduler binding constraints.';
        
        const unschedulable = conditions.find(c => c.type === 'PodScheduled' && c.status === 'False');
        if (unschedulable) {
          diagnosis.status = 'Critical';
          diagnosis.findings.push({
            title: 'Unschedulable Pod',
            description: unschedulable.message || 'Pod could not be scheduled to any active cluster node.',
            severity: 'error'
          });
          diagnosis.evidence.push({
            source: 'Scheduler Condition',
            content: `Reason: ${unschedulable.reason || 'Unknown'} - Message: ${unschedulable.message || 'No description'}`
          });
          diagnosis.remediation.push({
            description: 'Evaluate cluster resource allocations and node capacities. Ensure affinity/anti-affinity filters are correct.',
            commands: [
              'kubectl get nodes -o custom-columns=NAME:.metadata.name,CPU_ALLOCATABLE:.status.allocatable.cpu,MEM_ALLOCATABLE:.status.allocatable.memory',
              `kubectl describe pod ${podName} -n ${namespace}`
            ]
          });
        }
      }

      // 4. Diagnose Container Crashes / Pull Back-offs
      for (const cs of containerStatuses) {
        const waiting = cs.state?.waiting;
        const terminated = cs.state?.terminated;

        // Evidence: container state
        if (waiting) {
          diagnosis.evidence.push({
            source: `Container "${cs.name}" Waiting State`,
            content: `Reason: ${waiting.reason || 'None'} - Message: ${waiting.message || 'None'}`
          });
        }
        if (terminated) {
          diagnosis.evidence.push({
            source: `Container "${cs.name}" Terminated State`,
            content: `Reason: ${terminated.reason || 'None'} - ExitCode: ${terminated.exitCode} - FinishedAt: ${terminated.finishedAt?.toISOString()}`
          });
        }

        // CrashLoopBackOff detection
        if (waiting?.reason === 'CrashLoopBackOff') {
          diagnosis.status = 'Critical';
          diagnosis.summary = `Container "${cs.name}" is crash-looping continuously.`;
          diagnosis.findings.push({
            title: `CrashLoopBackOff: Container "${cs.name}"`,
            description: `The application process exited inside container "${cs.name}". Restart count is current at ${cs.restartCount}.`,
            severity: 'error'
          });

          // Check if OOMKilled happened previously
          if (terminated?.reason === 'OOMKilled' || cs.lastState?.terminated?.reason === 'OOMKilled') {
            diagnosis.findings.push({
              title: `OOMKilled: Out-of-Memory constraint triggered`,
              description: 'The container was terminated by the host OS kernel because it exceeded its configured memory limits.',
              severity: 'error'
            });
            diagnosis.remediation.push({
              description: 'Increase memory limits in the deployment spec, or resolve code level memory leaks.',
              commands: [
                `kubectl edit deployment -n ${namespace} <deployment-name>`,
                `kubectl top pod ${podName} -n ${namespace} --containers`
              ]
            });
          } else {
            diagnosis.remediation.push({
              description: 'Check container logs (including previous terminated run) to diagnose runtime start-up script exceptions.',
              commands: [
                `kubectl logs ${podName} -n ${namespace} -c ${cs.name} --previous --tail=50`,
                `kubectl describe pod ${podName} -n ${namespace}`
              ]
            });
          }
        }

        // ImagePullBackOff / ErrImagePull detection
        if (waiting?.reason === 'ImagePullBackOff' || waiting?.reason === 'ErrImagePull') {
          diagnosis.status = 'Critical';
          diagnosis.summary = `Container "${cs.name}" failed to pull container image tag.`;
          diagnosis.findings.push({
            title: `ImagePullBackOff: Container "${cs.name}"`,
            description: `Kubernetes failed to download image "${cs.image}". Reason: ${waiting.message || 'Registry auth failure or tag not found'}.`,
            severity: 'error'
          });
          diagnosis.remediation.push({
            description: 'Verify container image tags on public/private registry. Check imagePullSecrets configuration if using private repository.',
            commands: [
              `kubectl get secrets -n ${namespace}`,
              `kubectl describe pod ${podName} -n ${namespace}`
            ]
          });
        }
      }

      // 5. Append related events as evidence
      try {
        const events = await coreV1Api.listNamespacedEvent({ namespace });
        const podEvents = (events.items || []).filter(e => e.involvedObject?.name === podName && e.involvedObject?.kind === 'Pod');
        
        for (const e of podEvents.slice(0, 3)) {
          diagnosis.evidence.push({
            source: `K8s Pod Event: ${e.reason || 'Info'}`,
            content: e.message || ''
          });
        }
      } catch {
        // Fallback if event listing fails
      }

      return diagnosis;
    } catch (err) {
      console.error(`[KubeScope] Diagnostics failed for pod ${podName}:`, err);
      return {
        podName,
        namespace,
        status: 'Warning',
        summary: `Diagnostics failed to connect: ${err instanceof Error ? err.message : String(err)}`,
        findings: [{
          title: 'Diagnostic Interface Error',
          description: 'Failed to extract K8s runtime properties for this resource context.',
          severity: 'warning'
        }],
        evidence: [],
        remediation: [{
          description: 'Ensure kube-apiserver is reachable and your credentials have permission to read pods.',
          commands: [`kubectl get pod ${podName} -n ${namespace} -o yaml`]
        }]
      };
    }
  }
}

export const liveEventService = new EventService();
