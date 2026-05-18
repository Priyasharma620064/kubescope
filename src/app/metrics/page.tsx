import { BarChart3 } from 'lucide-react';

export default function MetricsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-violet-400" />
          Metrics Dashboard
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          CPU, memory, and cluster observability
        </p>
      </div>
      <div className="flex items-center justify-center h-[60vh] rounded-lg border border-dashed border-border/50">
        <p className="text-muted-foreground text-sm">
          Metrics Dashboard will be implemented in Commit 4
        </p>
      </div>
    </div>
  );
}
