import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { liveYamlService } from '../k8s/yaml.service';
import { demoYamlService } from '../k8s/demo/yaml.demo';

const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
const yamlService = isDemo ? demoYamlService : liveYamlService;

const TEMPLATES = [
  {
    id: 'pod',
    name: 'Simple Pod',
    description: 'A single container pod running an Nginx microservice.',
    yaml: `apiVersion: v1
kind: Pod
metadata:
  name: web-server-pod
  namespace: production
  labels:
    app: web-server
spec:
  containers:
  - name: web-container
    image: nginx:alpine
    ports:
    - containerPort: 80
    resources:
      requests:
        cpu: 100m
        memory: 128Mi
      limits:
        cpu: 250m
        memory: 256Mi`
  },
  {
    id: 'deployment',
    name: 'Nginx Deployment',
    description: 'A replicated Deployment running 3 instances of Nginx.',
    yaml: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  namespace: production
  labels:
    app: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx-container
        image: nginx:1.25.1
        ports:
        - containerPort: 80
        resources:
          requests:
            cpu: 150m
            memory: 128Mi
          limits:
            cpu: 300m
            memory: 256Mi`
  },
  {
    id: 'service',
    name: 'ClusterIP Service',
    description: 'Exposes load-balanced service endpoint internally.',
    yaml: `apiVersion: v1
kind: Service
metadata:
  name: nginx-service
  namespace: production
spec:
  selector:
    app: nginx
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
  type: ClusterIP`
  },
  {
    id: 'configmap',
    name: 'Application ConfigMap',
    description: 'KeyValue stores injecting configuration environment variables.',
    yaml: `apiVersion: v1
kind: ConfigMap
metadata:
  name: app-configurations
  namespace: production
data:
  database.url: "jdbc:postgresql://db-server:5432/main"
  features.enableCache: "true"
  features.maxConnections: "50"
  log.level: "DEBUG"`
  }
];

export const yamlRouter = router({
  listTemplates: publicProcedure.query(() => {
    return TEMPLATES;
  }),

  validate: publicProcedure
    .input(z.object({
      yaml: z.string(),
      dryRun: z.boolean().default(false)
    }))
    .mutation(async ({ input }) => {
      if (input.dryRun) {
        return await yamlService.dryRunApply(input.yaml);
      }
      return yamlService.parseYaml(input.yaml);
    }),

  apply: publicProcedure
    .input(z.object({
      yaml: z.string()
    }))
    .mutation(async ({ input }) => {
      return await yamlService.applyManifests(input.yaml);
    })
});
