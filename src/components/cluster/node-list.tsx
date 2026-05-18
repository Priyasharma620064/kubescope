'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Cpu, HardDrive, Server } from 'lucide-react';
import type { NodeResource } from '@/types/kubernetes';

interface NodeListProps {
  nodes: NodeResource[];
  isLoading?: boolean;
}

/**
 * Node inspector cards showing capacity, allocatable resources,
 * conditions, taints, and system info.
 */
export function NodeList({ nodes, isLoading }: NodeListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-48 rounded-lg bg-muted/50 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
      {nodes.map((node) => (
        <Card key={node.name} className="border-border/50 bg-card/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">{node.name}</CardTitle>
              </div>
              <Badge
                variant="outline"
                className={
                  node.status === 'Ready'
                    ? 'border-emerald-500/30 text-emerald-400 text-[10px]'
                    : 'border-rose-500/30 text-rose-400 text-[10px]'
                }
              >
                {node.status}
              </Badge>
            </div>
            <div className="flex gap-1 mt-1">
              {node.roles.map((role) => (
                <Badge key={role} variant="secondary" className="text-[10px] px-1.5 py-0">
                  {role}
                </Badge>
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Resources */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Cpu className="h-3 w-3" /> CPU
                </div>
                <div>
                  <span className="text-foreground font-medium">{node.allocatable.cpu}</span>
                  <span className="text-muted-foreground"> / {node.capacity.cpu}</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <HardDrive className="h-3 w-3" /> Memory
                </div>
                <div>
                  <span className="text-foreground font-medium">{node.allocatable.memory}</span>
                  <span className="text-muted-foreground"> / {node.capacity.memory}</span>
                </div>
              </div>
            </div>

            {/* Conditions */}
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Conditions</span>
              <div className="flex flex-wrap gap-1">
                {node.conditions.map((cond) => (
                  <Badge
                    key={cond.type}
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 ${
                      cond.type === 'Ready'
                        ? cond.status === 'True'
                          ? 'border-emerald-500/30 text-emerald-400'
                          : 'border-rose-500/30 text-rose-400'
                        : cond.status === 'True'
                          ? 'border-amber-500/30 text-amber-400'
                          : 'border-border/50 text-muted-foreground'
                    }`}
                  >
                    {cond.type}: {cond.status}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Taints */}
            {node.taints.length > 0 && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Taints</span>
                <div className="flex flex-wrap gap-1">
                  {node.taints.map((taint, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 border-orange-500/30 text-orange-400"
                    >
                      {taint.key}={taint.value || ''}:{taint.effect}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* System info */}
            <div className="text-[10px] text-muted-foreground pt-1 border-t border-border/30">
              {node.kubeletVersion} · {node.architecture} · {node.osImage}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
