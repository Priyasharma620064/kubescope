'use client';

import { useState } from 'react';
import { Server } from 'lucide-react';
import { trpc } from '@/lib/trpc-client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { NamespaceSelector } from '@/components/cluster/namespace-selector';
import { PodTable } from '@/components/cluster/pod-table';
import { DeploymentList } from '@/components/cluster/deployment-list';
import { NodeList } from '@/components/cluster/node-list';

/**
 * Cluster Explorer page — browse namespaces, pods, deployments, and nodes.
 * All data is fetched via tRPC with automatic demo/live mode switching.
 */
export default function ClusterPage() {
  const [selectedNamespace, setSelectedNamespace] = useState('default');
  const [searchQuery, setSearchQuery] = useState('');

  const namespacesQuery = trpc.cluster.namespaces.useQuery();
  const podsQuery = trpc.cluster.pods.useQuery(
    { namespace: selectedNamespace },
    { enabled: !!selectedNamespace }
  );
  const deploymentsQuery = trpc.cluster.deployments.useQuery(
    { namespace: selectedNamespace },
    { enabled: !!selectedNamespace }
  );
  const nodesQuery = trpc.cluster.nodes.useQuery();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Server className="h-6 w-6 text-blue-400" />
            Cluster Explorer
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Browse namespaces, pods, deployments, and nodes
          </p>
        </div>
        <NamespaceSelector
          namespaces={namespacesQuery.data || []}
          selected={selectedNamespace}
          onSelect={setSelectedNamespace}
          isLoading={namespacesQuery.isLoading}
        />
      </div>

      {/* Search */}
      <Input
        placeholder="Search pods by name or label..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="max-w-md bg-card border-border/50 h-9"
      />

      {/* Tabs */}
      <Tabs defaultValue="pods" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="pods" className="text-xs">
            Pods
            {podsQuery.data && (
              <span className="ml-1.5 text-muted-foreground">({podsQuery.data.length})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="deployments" className="text-xs">
            Deployments
            {deploymentsQuery.data && (
              <span className="ml-1.5 text-muted-foreground">({deploymentsQuery.data.length})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="nodes" className="text-xs">
            Nodes
            {nodesQuery.data && (
              <span className="ml-1.5 text-muted-foreground">({nodesQuery.data.length})</span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pods">
          <PodTable
            pods={podsQuery.data || []}
            isLoading={podsQuery.isLoading}
            searchQuery={searchQuery}
          />
        </TabsContent>

        <TabsContent value="deployments">
          <DeploymentList
            deployments={deploymentsQuery.data || []}
            isLoading={deploymentsQuery.isLoading}
          />
        </TabsContent>

        <TabsContent value="nodes">
          <NodeList
            nodes={nodesQuery.data || []}
            isLoading={nodesQuery.isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
