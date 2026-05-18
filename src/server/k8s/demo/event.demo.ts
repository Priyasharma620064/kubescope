import { EventService, ClusterEvent, PodDiagnosis } from '../event.service';

const MOCK_EVENTS: ClusterEvent[] = [
  {
    id: 'evt-1',
    type: 'Warning',
    reason: 'FailedScheduling',
    message: '0/3 nodes are available: 1 Insufficient cpu, 2 node(s) had untolerated taint.',
    source: 'default-scheduler',
    resourceKind: 'Pod',
    resourceName: 'ml-pipeline-9e8d7c-8w7z1',
    namespace: 'production',
    firstTimestamp: new Date(Date.now() - 3600000).toISOString(),
    lastTimestamp: new Date(Date.now() - 600000).toISOString(),
    count: 12,
  },
  {
    id: 'evt-2',
    type: 'Warning',
    reason: 'OOMKilled',
    message: 'Container ml-container was oomkilled by host kernel.',
    source: 'kubelet',
    resourceKind: 'Pod',
    resourceName: 'ml-pipeline-9e8d7c-8w7z1',
    namespace: 'production',
    firstTimestamp: new Date(Date.now() - 1800000).toISOString(),
    lastTimestamp: new Date(Date.now() - 300000).toISOString(),
    count: 5,
  },
  {
    id: 'evt-3',
    type: 'Warning',
    reason: 'BackOff',
    message: 'Back-off restarting failed container=payment-container pod=payment-svc-4a7b8c-5d6e7_production',
    source: 'kubelet',
    resourceKind: 'Pod',
    resourceName: 'payment-svc-4a7b8c-5d6e7',
    namespace: 'production',
    firstTimestamp: new Date(Date.now() - 1200000).toISOString(),
    lastTimestamp: new Date(Date.now() - 120000).toISOString(),
    count: 8,
  },
  {
    id: 'evt-4',
    type: 'Normal',
    reason: 'Scheduled',
    message: 'Successfully assigned production/web-server-pod to node-1',
    source: 'default-scheduler',
    resourceKind: 'Pod',
    resourceName: 'web-server-pod',
    namespace: 'production',
    firstTimestamp: new Date(Date.now() - 7200000).toISOString(),
    lastTimestamp: new Date(Date.now() - 7200000).toISOString(),
    count: 1,
  },
  {
    id: 'evt-5',
    type: 'Normal',
    reason: 'Started',
    message: 'Started container web-container',
    source: 'kubelet',
    resourceKind: 'Pod',
    resourceName: 'web-server-pod',
    namespace: 'production',
    firstTimestamp: new Date(Date.now() - 7180000).toISOString(),
    lastTimestamp: new Date(Date.now() - 7180000).toISOString(),
    count: 1,
  }
];

export class DemoEventService extends EventService {
  /** Return realistic mock event streams */
  async listEvents(namespace?: string): Promise<ClusterEvent[]> {
    if (namespace) {
      return MOCK_EVENTS.filter(e => e.namespace === namespace);
    }
    return MOCK_EVENTS;
  }

  /** Run high-fidelity rule-based diagnostics for mock pods */
  async diagnosePod(namespace: string, podName: string): Promise<PodDiagnosis> {
    const lowerName = podName.toLowerCase();

    // 1. Diagnose ml-pipeline Pod (OOMKilled & CrashLoopBackOff)
    if (lowerName.includes('ml-pipeline')) {
      return {
        podName,
        namespace,
        status: 'Critical',
        summary: 'Out-Of-Memory (OOM) crash detected. Container exceeded its memory limit of 256Mi and was terminated by the host OS kernel.',
        findings: [
          {
            title: 'OOMKilled Termination (Exit Code 137)',
            description: 'The host kernel terminated the process because it requested memory beyond its namespace limit. Typically caused by massive data loads, caching structures, or memory leaks.',
            severity: 'error'
          },
          {
            title: 'Continuous CrashLoopBackOff restarts',
            description: 'The container failed to recover after restarting 14 times. Kubelet is backing off starting the container to prevent system instability.',
            severity: 'error'
          }
        ],
        evidence: [
          {
            source: 'Container Terminated State',
            content: 'Reason: OOMKilled - ExitCode: 137 - FinishedAt: 3m ago - Message: Out of Memory'
          },
          {
            source: 'Kubelet Host Event',
            content: 'Warning OOMKilled 5m ago - Container ml-container was oomkilled by host kernel.'
          },
          {
            source: 'Pod Restart Counter',
            content: 'Restarts: 14 (Failed to stabilize in production namespace)'
          }
        ],
        remediation: [
          {
            description: 'Increase container memory limits to 512Mi or 1Gi in your YAML Studio manifest, then re-apply.',
            commands: [
              'kubectl edit deployment -n production ml-pipeline',
              'kubectl top pod ' + podName + ' -n production'
            ]
          },
          {
            description: 'Inspect application heap limits or profiling telemetry to verify memory allocation trends.',
            commands: [
              'kubectl logs ' + podName + ' -n production -c ml-container --previous --tail=100'
            ]
          }
        ]
      };
    }

    // 2. Diagnose payment-svc Pod (ImagePullBackOff)
    if (lowerName.includes('payment')) {
      return {
        podName,
        namespace,
        status: 'Warning',
        summary: 'ImagePullBackOff triggered. Kubelet was unable to download the container image from the specified registry.',
        findings: [
          {
            title: 'Image Registry Fetch Failure',
            description: 'Kubernetes failed to resolve or pull image tag "payment-service:v2.9-invalid". Either the image tag is incorrect or the repository is private.',
            severity: 'error'
          }
        ],
        evidence: [
          {
            source: 'Container Waiting State',
            content: 'Reason: ImagePullBackOff - Message: Back-off pulling image "payment-service:v2.9-invalid"'
          },
          {
            source: 'Kubelet Registry Event',
            content: 'Warning Failed 12m ago - Failed to pull image "payment-service:v2.9-invalid": rpc error: code = NotFound desc = failed to pull'
          }
        ],
        remediation: [
          {
            description: 'Verify the image registry address and tag in YAML Studio, then re-apply.',
            commands: [
              'docker manifest inspect payment-service:v2.9-invalid',
              'kubectl describe pod ' + podName + ' -n ' + namespace
            ]
          }
        ]
      };
    }

    // 3. Healthy pod default
    return {
      podName,
      namespace,
      status: 'Healthy',
      summary: 'Pod is running optimally. Standard CPU/Memory utilization levels, zero restarts, and all core health checks passing.',
      findings: [
        {
          title: 'All Conditions Satisfied',
          description: 'PodScheduled, PodReady, PodInitialized, and ContainersReady are all in True status.',
          severity: 'info'
        }
      ],
      evidence: [
        {
          source: 'Pod Status Phase',
          content: 'Phase: Running'
        },
        {
          source: 'K8s Readiness Probe',
          content: 'Status: 200 OK (Readiness probe passed in 12ms)'
        }
      ],
      remediation: [
        {
          description: 'No remediation needed. Keep tracking logs and metrics in real-time.',
          commands: [
            'kubectl get pod ' + podName + ' -n ' + namespace,
            'kubectl top pod ' + podName + ' -n ' + namespace
          ]
        }
      ]
    };
  }
}

export const demoEventService = new DemoEventService();
