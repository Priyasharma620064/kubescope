'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { NamespaceResource } from '@/types/kubernetes';

interface NamespaceSelectorProps {
  namespaces: NamespaceResource[];
  selected: string;
  onSelect: (ns: string) => void;
  isLoading?: boolean;
}

/**
 * Namespace dropdown selector with status badges.
 * Filters all Cluster Explorer views by the selected namespace.
 */
export function NamespaceSelector({
  namespaces,
  selected,
  onSelect,
  isLoading,
}: NamespaceSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Namespace:</span>
      <Select value={selected} onValueChange={onSelect} disabled={isLoading}>
        <SelectTrigger className="w-[200px] h-9 bg-card border-border/50">
          <SelectValue placeholder="Select namespace" />
        </SelectTrigger>
        <SelectContent>
          {namespaces.map((ns) => (
            <SelectItem key={ns.name} value={ns.name}>
              <div className="flex items-center gap-2">
                <span>{ns.name}</span>
                <Badge
                  variant="outline"
                  className={
                    ns.status === 'Active'
                      ? 'border-emerald-500/30 text-emerald-400 text-[10px] px-1.5 py-0'
                      : 'border-amber-500/30 text-amber-400 text-[10px] px-1.5 py-0'
                  }
                >
                  {ns.status}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
