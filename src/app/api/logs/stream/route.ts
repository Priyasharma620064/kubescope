import { NextRequest } from 'next/server';
import { PassThrough } from 'node:stream';
import * as k8s from '@kubernetes/client-node';
import { kubeConfig } from '@/server/k8s/client';

export const dynamic = 'force-dynamic';

interface DemoTemplate {
  podPattern: RegExp;
  serviceName: string;
  logs: string[];
}

const DEMO_LOG_TEMPLATES: DemoTemplate[] = [
  {
    podPattern: /api-gateway/i,
    serviceName: 'api-gateway',
    logs: [
      'incoming request GET /api/v1/health',
      'incoming request POST /api/v1/auth/login',
      'successful authentication for user uid-84920',
      'incoming request GET /api/v1/cluster/status',
      'routing request to auth-service:8080',
      'routing request to billing-service:8082',
      'cache hit for endpoint /api/v1/health (ttl 30s)',
      'rate limit check passed for IP 10.244.1.84',
      'db connection pool usage: 12% active, 88% idle',
      'flushed 15 audit events to elasticsearch buffer',
    ],
  },
  {
    podPattern: /payment|billing/i,
    serviceName: 'billing-service',
    logs: [
      'processing payment payload for transaction tx_848201',
      'validating credit card details format with gateway Stripe',
      'Stripe handshake completed in 142ms',
      'charge authorized successfully: $120.00',
      'updating user billing status in cockroachdb: SUCCESS',
      'sending transaction confirmation email to user-84920@gmail.com',
      'received webhook event from stripe: payment_intent.succeeded',
      'reconciled ledger entry tx_848201 with bank statement',
      'WARNING: billing service CPU spikes above 80% during transaction batching',
      'ERROR: bank gateway connection timed out (retrying in 5s...)',
    ],
  },
  {
    podPattern: /postgres|db|cockroach|mysql/i,
    serviceName: 'db-cluster',
    logs: [
      'received connection from 10.244.0.12:54320',
      'executing statement: SELECT * FROM users WHERE id = $1',
      'executing statement: UPDATE transactions SET status = $1 WHERE tx_id = $2',
      'query planner completed in 2.1ms (index scan used on users_pkey)',
      'automatic vacuum trigger started on table core.events',
      'checkpoint starting: force write all dirty buffers',
      'checkpoint completed: wrote 842 dirty buffers in 4.2s',
      'replication lag to standby-0 is 12ms',
      'WARNING: disk I/O utilization at 88% of provisioned IOPS',
      'ERROR: deadlock detected: process 40821 waiting for ShareLock on transaction 98402',
    ],
  },
  {
    podPattern: /auth|user/i,
    serviceName: 'auth-service',
    logs: [
      'validating session token format',
      'verifying signature using asymmetric key pair key_v2',
      'generating access token jwt_248a02f (expires in 1h)',
      'refresh token request received for session sess_84021a',
      'user logout request completed: sessions invalidated',
      'password hashing completed using bcrypt-rounds-12 in 85ms',
      'failed login attempt for email: hacker@danger.com (invalid password)',
      'WARNING: 5 consecutive failed login attempts for IP 192.168.1.104',
      'WARNING: rotation needed for secret auth-signing-keys in 3 days',
      'ERROR: auth database backend did not respond within 2.0s',
    ],
  },
];

const DEFAULT_DEMO_LOGS = [
  'container initialized successfully',
  'loading application configurations from environment',
  'starting node.js runtime server',
  'listening on address 0.0.0.0:8080',
  'heartbeat sent to cluster supervisor',
  'checking system memory boundaries',
  'garbage collection cycle freed 42MB heap space',
  'active connection threads: 14',
  'performance trace completed: event loop latency 1.2ms',
  'logging transport initialized: ConsoleTransport',
];

function generateDemoLogLine(podName: string): string {
  const matched = DEMO_LOG_TEMPLATES.find((t) => t.podPattern.test(podName));
  const service = matched ? matched.serviceName : 'app-service';
  const logsList = matched ? matched.logs : DEFAULT_DEMO_LOGS;

  const timestamp = new Date().toISOString();
  const rawLog = logsList[Math.floor(Math.random() * logsList.length)];

  let level = 'INFO';
  if (rawLog.toUpperCase().startsWith('ERROR:')) level = 'ERROR';
  else if (rawLog.toUpperCase().startsWith('WARNING:')) level = 'WARN';
  else if (rawLog.toUpperCase().startsWith('DEBUG:')) level = 'DEBUG';
  else {
    // Inject random levels to keep logs dynamic
    const rand = Math.random();
    if (rand < 0.15) level = 'DEBUG';
    else if (rand < 0.22) level = 'WARN';
    else if (rand < 0.25) level = 'ERROR';
  }

  // Clean rawLog if it has level prefixes
  const cleanLog = rawLog.replace(/^(ERROR|WARNING|DEBUG|INFO):\s*/i, '');

  return `${timestamp} [${level}] [${service}] ${cleanLog}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const namespace = searchParams.get('namespace');
  const pod = searchParams.get('pod');
  const container = searchParams.get('container');
  const previous = searchParams.get('previous') === 'true';
  const tailLines = searchParams.get('tail') ? parseInt(searchParams.get('tail')!) : 100;

  if (!namespace || !pod || !container) {
    return new Response(JSON.stringify({ error: 'Missing required parameters: namespace, pod, container' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const responseHeaders = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
  });

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: { log: string }) => {
        controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
      };

      // 1. DEMO MODE STREAMING
      if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
        // Send initial backlog
        for (let i = 0; i < tailLines; i++) {
          sendEvent({ log: generateDemoLogLine(pod) });
        }

        const intervalId = setInterval(() => {
          sendEvent({ log: generateDemoLogLine(pod) });
        }, 400);

        req.signal.addEventListener('abort', () => {
          clearInterval(intervalId);
          controller.close();
        });
        return;
      }

      // 2. LIVE CLUSTER STREAMING
      try {
        const logReader = new k8s.Log(kubeConfig);
        const passThrough = new PassThrough();

        passThrough.on('data', (chunk) => {
          const text = chunk.toString();
          const lines = text.split('\n');
          for (const line of lines) {
            if (line.trim()) {
              sendEvent({ log: line });
            }
          }
        });

        // Start streaming logs from K8s API
        const abortController = await logReader.log(
          namespace,
          pod,
          container,
          passThrough,
          {
            follow: true,
            previous,
            tailLines,
            timestamps: true,
          }
        );

        req.signal.addEventListener('abort', () => {
          abortController.abort();
          passThrough.destroy();
          controller.close();
        });
      } catch (err) {
        sendEvent({ log: `${new Date().toISOString()} [ERROR] [Kubescope] Failed to connect to pod logs: ${String(err)}` });
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: responseHeaders });
}
