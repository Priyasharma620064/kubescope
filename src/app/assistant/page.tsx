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
      <div className="flex flex-col items-center justify-center h-[60vh] rounded-lg border border-dashed border-border/50 gap-3">
        <p className="text-muted-foreground text-sm">
          The Diagnostic AI Assistant has been integrated directly into the **Events & Diagnostics Workbench**.
        </p>
        <a 
          href="/events" 
          className="text-sm text-pink-500 hover:text-pink-400 underline font-medium"
        >
          Go to Events & Diagnostics →
        </a>
      </div>
    </div>
  );
}
