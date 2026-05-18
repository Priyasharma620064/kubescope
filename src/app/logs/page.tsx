import { ScrollText } from 'lucide-react';

export default function LogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ScrollText className="h-6 w-6 text-emerald-400" />
          Live Logs
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Real-time pod log streaming with search and filtering
        </p>
      </div>
      <div className="flex items-center justify-center h-[60vh] rounded-lg border border-dashed border-border/50">
        <p className="text-muted-foreground text-sm">
          Live Logs Explorer will be implemented in Commit 3
        </p>
      </div>
    </div>
  );
}
