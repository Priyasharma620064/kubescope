import { Server } from 'lucide-react';

export default function ClusterPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Server className="h-6 w-6 text-blue-400" />
          Cluster Explorer
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Browse namespaces, pods, deployments, and nodes
        </p>
      </div>
      <div className="flex items-center justify-center h-[60vh] rounded-lg border border-dashed border-border/50">
        <p className="text-muted-foreground text-sm">
          Cluster Explorer will be implemented in Commit 2
        </p>
      </div>
    </div>
  );
}
