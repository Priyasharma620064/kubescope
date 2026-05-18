import { Bot } from 'lucide-react';

export default function AssistantPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Bot className="h-6 w-6 text-indigo-400" />
          AI Cluster Assistant
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Rule-based diagnostic engine for debugging cluster issues
        </p>
      </div>
      <div className="flex items-center justify-center h-[60vh] rounded-lg border border-dashed border-border/50">
        <p className="text-muted-foreground text-sm">
          AI Assistant will be implemented in Commit 6
        </p>
      </div>
    </div>
  );
}
