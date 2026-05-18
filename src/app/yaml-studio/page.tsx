import { FileCode2 } from 'lucide-react';

export default function YamlStudioPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FileCode2 className="h-6 w-6 text-orange-400" />
          YAML Studio
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Edit and validate Kubernetes resources with schema support
        </p>
      </div>
      <div className="flex items-center justify-center h-[60vh] rounded-lg border border-dashed border-border/50">
        <p className="text-muted-foreground text-sm">
          YAML Studio will be implemented in Commit 5
        </p>
      </div>
    </div>
  );
}
