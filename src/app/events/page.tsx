import { CalendarClock } from 'lucide-react';

export default function EventsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <CalendarClock className="h-6 w-6 text-pink-400" />
          Event Timeline
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Visual timeline of cluster events with severity filtering
        </p>
      </div>
      <div className="flex items-center justify-center h-[60vh] rounded-lg border border-dashed border-border/50">
        <p className="text-muted-foreground text-sm">
          Event Timeline will be implemented in Commit 6
        </p>
      </div>
    </div>
  );
}
