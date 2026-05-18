'use client';

import { useState, useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc-client';
import { useLogStream, StreamStatus } from '@/hooks/useLogStream';
import { 
  ScrollText, 
  Play, 
  Pause, 
  Download, 
  Trash2, 
  Search, 
  RefreshCw, 
  Terminal, 
  ArrowDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function LogsPage() {
  const [selectedNamespace, setSelectedNamespace] = useState<string>('production');
  const [selectedPod, setSelectedPod] = useState<string>('');
  const [selectedContainer, setSelectedContainer] = useState<string>('');
  const [previous, setPrevious] = useState(false);
  const [tail, setTail] = useState(200);
  const [autoScroll, setAutoScroll] = useState(true);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Queries
  const { data: namespaces, isLoading: loadingNamespaces } = trpc.cluster.namespaces.useQuery();
  const { data: pods, isLoading: loadingPods } = trpc.cluster.pods.useQuery(
    { namespace: selectedNamespace },
    { enabled: !!selectedNamespace }
  );

  // Auto-select first pod & container when pods load
  useEffect(() => {
    if (pods && pods.length > 0) {
      const firstPod = pods[0];
      setSelectedPod(firstPod.name);
      if (firstPod.containers && firstPod.containers.length > 0) {
        setSelectedContainer(firstPod.containers[0].name);
      } else {
        setSelectedContainer('');
      }
    } else {
      setSelectedPod('');
      setSelectedContainer('');
    }
  }, [pods]);

  // Update selected container when selected pod changes
  useEffect(() => {
    if (pods && selectedPod) {
      const pod = pods.find((p: { name: string; containers?: Array<{ name: string }> }) => p.name === selectedPod);
      if (pod && pod.containers && pod.containers.length > 0) {
        setSelectedContainer(pod.containers[0].name);
      } else {
        setSelectedContainer('');
      }
    }
  }, [selectedPod, pods]);

  // Hook for streaming logs
  const {
    logs,
    allBufferLogs,
    status,
    filterText,
    setFilterText,
    useRegex,
    setUseRegex,
    pause,
    resume,
    clear,
    download,
    reconnect,
  } = useLogStream({
    namespace: selectedNamespace,
    pod: selectedPod || null,
    container: selectedContainer || null,
    previous,
    tail,
  });

  // Auto scroll effect
  useEffect(() => {
    if (autoScroll && scrollContainerRef.current) {
      const el = scrollContainerRef.current;
      el.scrollTop = el.scrollHeight;
    }
  }, [logs, autoScroll]);

  // Check scroll position to lock/unlock auto scroll
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const el = scrollContainerRef.current;
    const isAtBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 25;
    setAutoScroll(isAtBottom);
  };

  const forceScrollToBottom = () => {
    if (scrollContainerRef.current) {
      const el = scrollContainerRef.current;
      el.scrollTop = el.scrollHeight;
      setAutoScroll(true);
    }
  };

  const getStatusColor = (s: StreamStatus) => {
    switch (s) {
      case 'connected':
        return 'bg-emerald-500 text-emerald-950 hover:bg-emerald-500/90';
      case 'connecting':
        return 'bg-amber-500 text-amber-950 hover:bg-amber-500/90';
      case 'paused':
        return 'bg-orange-500 text-orange-950 hover:bg-orange-500/90';
      case 'error':
        return 'bg-red-500 text-white hover:bg-red-500/90';
      default:
        return 'bg-neutral-700 text-neutral-200';
    }
  };

  const getLevelStyle = (level: string) => {
    switch (level) {
      case 'ERROR':
        return 'text-red-400 font-bold bg-red-950/40 border-red-900/50';
      case 'WARN':
        return 'text-amber-400 font-bold bg-amber-950/40 border-amber-900/50';
      case 'INFO':
        return 'text-emerald-400 bg-emerald-950/40 border-emerald-900/50';
      case 'DEBUG':
        return 'text-cyan-400 bg-cyan-950/40 border-cyan-900/50';
      default:
        return 'text-neutral-400 bg-neutral-900/40 border-neutral-800';
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-6rem)]">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ScrollText className="h-6 w-6 text-emerald-400 animate-pulse" />
            Live Logs Explorer
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Stream microservice container logs in real-time with regex search and pause controls
          </p>
        </div>

        {/* Global Connection Badge */}
        <div className="flex items-center gap-2">
          {status === 'connected' && (
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          )}
          <Badge className={`capitalize font-semibold border-none px-3 py-1 ${getStatusColor(status)}`}>
            {status}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="h-8 border-border/50 bg-background/50 hover:bg-neutral-900"
            onClick={reconnect}
            disabled={status === 'connecting'}
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${status === 'connecting' ? 'animate-spin' : ''}`} />
            Reconnect
          </Button>
        </div>
      </div>

      {/* Grid Controls panel */}
      <Card className="border-border/40 bg-neutral-950/40 shrink-0">
        <CardContent className="p-4 flex flex-col lg:flex-row gap-4">
          {/* Target Resource selectors */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
            {/* Namespace Select */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Namespace</Label>
              <Select 
                value={selectedNamespace} 
                onValueChange={(val) => {
                  setSelectedNamespace(val);
                  setSelectedPod('');
                  setSelectedContainer('');
                }}
              >
                <SelectTrigger className="bg-background/40 border-border/40 text-neutral-200">
                  <SelectValue placeholder="Select Namespace" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-border/50 text-neutral-200">
                  {loadingNamespaces ? (
                    <SelectItem value="loading" disabled>Loading namespaces...</SelectItem>
                  ) : (
                    namespaces?.map((ns: { name: string }) => (
                      <SelectItem key={ns.name} value={ns.name}>{ns.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Pod Select */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Pod</Label>
              <Select 
                value={selectedPod} 
                onValueChange={(val) => {
                  setSelectedPod(val);
                  setSelectedContainer('');
                }}
              >
                <SelectTrigger className="bg-background/40 border-border/40 text-neutral-200">
                  <SelectValue placeholder="Select Pod" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-border/50 text-neutral-200">
                  {loadingPods ? (
                    <SelectItem value="loading" disabled>Loading pods...</SelectItem>
                  ) : pods && pods.length > 0 ? (
                    pods.map((p: { name: string }) => (
                      <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>No pods in namespace</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Container Select */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Container</Label>
              <Select value={selectedContainer} onValueChange={setSelectedContainer}>
                <SelectTrigger className="bg-background/40 border-border/40 text-neutral-200">
                  <SelectValue placeholder="Select Container" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-border/50 text-neutral-200">
                  {selectedPod && pods?.find((p: { name: string; containers?: Array<{ name: string }> }) => p.name === selectedPod)?.containers?.map((c: { name: string }) => (
                    <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                  )) || (
                    <SelectItem value="none" disabled>No container available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Toggle Switches / Configurations */}
          <div className="flex flex-wrap items-center gap-4 border-t lg:border-t-0 lg:border-l border-border/30 pt-4 lg:pt-0 lg:pl-4 shrink-0">
            {/* Previous container logs */}
            <div className="flex items-center space-x-2">
              <Switch id="previous-toggle" checked={previous} onCheckedChange={setPrevious} />
              <Label htmlFor="previous-toggle" className="text-xs text-neutral-300 font-medium cursor-pointer">
                Previous Logs
              </Label>
            </div>

            {/* Tail lines input */}
            <div className="flex items-center space-x-2">
              <Label htmlFor="tail-select" className="text-xs text-neutral-300">
                Backlog:
              </Label>
              <Select value={String(tail)} onValueChange={(val) => setTail(parseInt(val))}>
                <SelectTrigger id="tail-select" className="w-[85px] h-8 bg-background/40 border-border/40 text-xs">
                  <SelectValue placeholder="Lines" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-border/50 text-xs text-neutral-200">
                  <SelectItem value="50">50 lines</SelectItem>
                  <SelectItem value="100">100 lines</SelectItem>
                  <SelectItem value="200">200 lines</SelectItem>
                  <SelectItem value="500">500 lines</SelectItem>
                  <SelectItem value="1000">1000 lines</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Terminal Board */}
      <div className="flex flex-col flex-1 border border-border/40 bg-neutral-950 rounded-lg overflow-hidden relative shadow-inner">
        {/* Terminal Header controls */}
        <div className="h-12 border-b border-border/40 bg-neutral-900/60 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3 flex-1 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Regex or string search..."
                className="pl-9 h-8 bg-neutral-950/40 border-border/40 text-xs text-neutral-200 focus-visible:ring-emerald-500/20"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-1.5 border border-border/40 rounded px-2 h-8 bg-neutral-950/20 shrink-0">
              <Switch 
                id="regex-search" 
                className="scale-75"
                checked={useRegex} 
                onCheckedChange={setUseRegex} 
              />
              <Label htmlFor="regex-search" className="text-[10px] text-neutral-400 font-medium cursor-pointer">
                Regex
              </Label>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Display Line Counts */}
            <span className="text-[10px] text-neutral-400 font-mono hidden md:inline border-r border-border/30 pr-3 mr-1">
              Showing {logs.length} / {allBufferLogs.length} lines
            </span>

            <TooltipProvider>
              {/* Play/Pause controls */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-neutral-300 hover:text-white hover:bg-neutral-800"
                    onClick={status === 'connected' ? pause : resume}
                    disabled={status === 'disconnected' || status === 'error'}
                  >
                    {status === 'connected' ? (
                      <Pause className="h-4 w-4 text-orange-400" />
                    ) : (
                      <Play className="h-4 w-4 text-emerald-400 animate-pulse" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-neutral-900 border-border/50 text-xs text-neutral-200">
                  {status === 'connected' ? 'Pause log stream' : 'Resume log stream'}
                </TooltipContent>
              </Tooltip>

              {/* Clear controls */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-neutral-300 hover:text-white hover:bg-neutral-800"
                    onClick={clear}
                  >
                    <Trash2 className="h-4 w-4 text-neutral-400" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-neutral-900 border-border/50 text-xs text-neutral-200">
                  Clear log viewer
                </TooltipContent>
              </Tooltip>

              {/* Download controls */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-neutral-300 hover:text-white hover:bg-neutral-800"
                    onClick={download}
                    disabled={allBufferLogs.length === 0}
                  >
                    <Download className="h-4 w-4 text-emerald-400" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-neutral-900 border-border/50 text-xs text-neutral-200">
                  Download log history (.log)
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Log rows scroll view */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed space-y-1.5 select-text selection:bg-emerald-500/25 custom-scrollbar"
          style={{ backgroundColor: '#030303' }}
        >
          {logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2 select-none py-10">
              <Terminal className="h-10 w-10 text-neutral-700 animate-pulse" />
              <p className="text-neutral-500 text-xs">
                {selectedPod 
                  ? filterText 
                    ? 'No logs matching current filter' 
                    : 'Stream opened. Waiting for incoming application logs...'
                  : 'Please select a pod to start streaming logs'}
              </p>
            </div>
          ) : (
            logs.map((log) => (
              <div 
                key={log.id} 
                className="flex items-start gap-3 hover:bg-white/[0.02] py-0.5 rounded px-2 group transition-colors duration-150 relative border-l-2 border-transparent hover:border-emerald-500/30"
              >
                {/* Timestamp column */}
                {log.timestamp && (
                  <span className="text-[10px] text-neutral-500 shrink-0 select-none group-hover:text-neutral-400">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
                      '.' + new Date(log.timestamp).getMilliseconds().toString().padStart(3, '0')}
                  </span>
                )}

                {/* Level Column */}
                {log.level !== 'UNKNOWN' && (
                  <span className={`text-[9px] px-1.5 py-px rounded border font-semibold shrink-0 select-none ${getLevelStyle(log.level)}`}>
                    {log.level}
                  </span>
                )}

                {/* Log Line Message content */}
                <span className="text-neutral-300 break-all whitespace-pre-wrap flex-1 selection:text-white">
                  {log.content}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Scroll back to bottom floating bubble alert */}
        {!autoScroll && logs.length > 0 && (
          <Button
            size="sm"
            onClick={forceScrollToBottom}
            className="absolute bottom-4 right-4 rounded-full bg-emerald-500 hover:bg-emerald-600 text-emerald-950 shadow-lg flex items-center gap-1.5 animate-bounce"
          >
            <ArrowDown className="h-4 w-4" />
            Resume Auto-Scroll
          </Button>
        )}
      </div>
    </div>
  );
}
