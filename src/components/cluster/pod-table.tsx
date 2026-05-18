'use client';

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { POD_PHASE_COLORS } from '@/lib/constants';
import type { PodResource } from '@/types/kubernetes';

interface PodTableProps {
  pods: PodResource[];
  isLoading?: boolean;
  searchQuery?: string;
}

function getStatusDisplay(pod: PodResource): { label: string; colorClass: string } {
  // Check for special container states first
  const waitingContainer = pod.containers.find(
    (c) => c.state === 'waiting' && c.stateReason
  );
  if (waitingContainer?.stateReason) {
    return {
      label: waitingContainer.stateReason,
      colorClass: POD_PHASE_COLORS[waitingContainer.stateReason] || POD_PHASE_COLORS[pod.phase] || '',
    };
  }
  return {
    label: pod.phase,
    colorClass: POD_PHASE_COLORS[pod.phase] || '',
  };
}

function getAge(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600_000);
  if (hours < 1) return `${Math.floor(diff / 60_000)}m`;
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

/**
 * Pod table displaying all pods in the selected namespace
 * with status badges, restart counts, and age calculation.
 */
export function PodTable({ pods, isLoading, searchQuery }: PodTableProps) {
  const filtered = searchQuery
    ? pods.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        Object.values(p.labels).some((v) => v.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : pods;

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 rounded-md bg-muted/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 rounded-lg border border-dashed border-border/50">
        <p className="text-sm text-muted-foreground">No pods found</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/50 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border/50">
            <TableHead className="text-xs font-medium">Name</TableHead>
            <TableHead className="text-xs font-medium">Status</TableHead>
            <TableHead className="text-xs font-medium">Restarts</TableHead>
            <TableHead className="text-xs font-medium">Age</TableHead>
            <TableHead className="text-xs font-medium">Node</TableHead>
            <TableHead className="text-xs font-medium">IP</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((pod) => {
            const status = getStatusDisplay(pod);
            return (
              <TableRow key={pod.name} className="border-border/30">
                <TableCell className="font-mono text-xs py-3">{pod.name}</TableCell>
                <TableCell className="py-3">
                  <Badge variant="outline" className={`text-[11px] px-2 py-0.5 ${status.colorClass}`}>
                    {status.label}
                  </Badge>
                </TableCell>
                <TableCell className="py-3">
                  <span className={pod.restartCount > 5 ? 'text-rose-400 font-medium' : 'text-muted-foreground'}>
                    {pod.restartCount}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs py-3">
                  {getAge(pod.createdAt)}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs py-3">
                  {pod.nodeName || '—'}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs font-mono py-3">
                  {pod.podIP || '—'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
