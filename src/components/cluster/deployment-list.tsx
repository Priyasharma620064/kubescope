'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { DeploymentResource } from '@/types/kubernetes';

interface DeploymentListProps {
  deployments: DeploymentResource[];
  isLoading?: boolean;
}

/**
 * Deployment cards showing replica status, strategy, and conditions.
 */
export function DeploymentList({ deployments, isLoading }: DeploymentListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 rounded-lg bg-muted/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (deployments.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 rounded-lg border border-dashed border-border/50">
        <p className="text-sm text-muted-foreground">No deployments found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {deployments.map((dep) => {
        const isHealthy = dep.readyReplicas >= dep.replicas;
        return (
          <Card key={dep.name} className="border-border/50 bg-card/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{dep.name}</CardTitle>
                <Badge
                  variant="outline"
                  className={
                    isHealthy
                      ? 'border-emerald-500/30 text-emerald-400 text-[10px]'
                      : 'border-rose-500/30 text-rose-400 text-[10px]'
                  }
                >
                  {isHealthy ? 'Healthy' : 'Degraded'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Replica bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Replicas</span>
                  <span>
                    <span className={isHealthy ? 'text-emerald-400' : 'text-rose-400'}>
                      {dep.readyReplicas}
                    </span>
                    <span className="text-muted-foreground">/{dep.replicas}</span>
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isHealthy ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${dep.replicas > 0 ? (dep.readyReplicas / dep.replicas) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Strategy: {dep.strategy}</span>
                <span>Updated: {dep.updatedReplicas}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
