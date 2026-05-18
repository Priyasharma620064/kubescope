'use client';

import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc-client';
import { 
  CalendarClock, 
  AlertTriangle, 
  CheckCircle2, 
  Terminal, 
  Search, 
  Filter, 
  Activity, 
  ChevronRight,
  ClipboardCheck,
  RefreshCw,
  Zap,
  ShieldCheck
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

export default function EventsPage() {
  const [mounted, setMounted] = useState(false);
  
  // Filter states
  const [selectedNamespace, setSelectedNamespace] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<'All' | 'Normal' | 'Warning'>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Diagnostic states
  const [diagNamespace, setDiagNamespace] = useState<string>('production');
  const [selectedPodName, setSelectedPodName] = useState<string>('');
  const [triggerDiagnostic, setTriggerDiagnostic] = useState<boolean>(false);

  // Queries
  const { data: namespaces } = trpc.cluster.namespaces.useQuery();
  const { data: pods } = trpc.cluster.pods.useQuery({ namespace: diagNamespace === 'all' ? 'production' : diagNamespace });
  
  const { data: events, isLoading: loadingEvents, refetch: refetchEvents, isFetching: fetchingEvents } = trpc.cluster.events.useQuery(
    { namespace: selectedNamespace === 'all' ? undefined : selectedNamespace },
    { refetchInterval: 10000 }
  );

  const { data: diagnosis, isLoading: loadingDiagnosis } = trpc.cluster.diagnosePod.useQuery(
    { namespace: diagNamespace, podName: selectedPodName },
    { enabled: triggerDiagnostic && !!selectedPodName }
  );

  // SSR safety
  useEffect(() => {
    setMounted(true);
  }, []);

  // Pre-select first pod when pod list loads
  useEffect(() => {
    if (pods && pods.length > 0 && !selectedPodName) {
      setSelectedPodName(pods[0].name);
    }
  }, [pods, selectedPodName]);

  const handleRunDiagnosis = () => {
    if (!selectedPodName) return;
    setTriggerDiagnostic(true);
  };

  // Filter events based on UI inputs
  const filteredEvents = events?.filter(evt => {
    const matchesSeverity = severityFilter === 'All' || evt.type === severityFilter;
    const matchesSearch = searchQuery === '' || 
      evt.resourceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesSearch;
  }) || [];

  if (!mounted) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-neutral-800 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[75vh]">
          <div className="lg:col-span-2 bg-neutral-800 rounded-lg" />
          <div className="lg:col-span-1 bg-neutral-800 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-6rem)]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-zinc-100">
            <CalendarClock className="h-6 w-6 text-pink-500 animate-pulse" />
            Events & Diagnostics Workbench
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time cluster event stream tracking unified with a rule-based AI Diagnostic Assistant.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetchEvents()}
          className="border-zinc-800 hover:bg-zinc-900 text-zinc-300 shrink-0 self-start sm:self-center"
        >
          <RefreshCw className={`h-4 w-4 mr-2 text-pink-500 ${fetchingEvents ? 'animate-spin' : ''}`} />
          Force Refresh
        </Button>
      </div>

      <Separator className="bg-zinc-800/80 shrink-0" />

      {/* Double Column Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0 flex-1">
        
        {/* Left Column: Events Timeline */}
        <div className="lg:col-span-2 flex flex-col gap-4 min-h-0">
          <Card className="bg-zinc-950 border-zinc-800/80 shadow-2xl flex flex-col min-h-0 flex-1">
            
            {/* Timeline Filter Header */}
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/20 shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-xs text-zinc-400 border-zinc-800 bg-zinc-900 flex items-center gap-1 py-1">
                  <Filter className="h-3 w-3 text-pink-500" />
                  Timeline Filters
                </Badge>

                {/* Severity selectors */}
                <div className="flex bg-zinc-900 p-0.5 rounded-lg border border-zinc-800/80">
                  {(['All', 'Normal', 'Warning'] as const).map(sev => (
                    <button
                      key={sev}
                      onClick={() => setSeverityFilter(sev)}
                      className={`text-[10px] font-semibold px-2.5 py-1 rounded-md transition-all duration-200 ${
                        severityFilter === sev
                          ? sev === 'Warning'
                            ? 'bg-amber-950/40 text-amber-400 border border-amber-800/30'
                            : sev === 'Normal'
                            ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/30'
                            : 'bg-zinc-800 text-zinc-200 border border-zinc-700/50'
                          : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search & Namespace drop-down */}
              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={selectedNamespace}
                  onChange={(e) => setSelectedNamespace(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-pink-500/50 transition-all shrink-0"
                >
                  <option value="all">All Namespaces</option>
                  {namespaces?.map((ns: { name: string }) => (
                    <option key={ns.name} value={ns.name}>{ns.name}</option>
                  ))}
                </select>

                <div className="relative w-full max-w-[200px]">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                  <Input
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 bg-zinc-900 border-zinc-800 h-8 text-xs text-zinc-300 placeholder:text-zinc-600 focus-visible:ring-pink-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Timeline Stream Box */}
            <CardContent className="p-4 flex-1 overflow-y-auto space-y-4">
              {loadingEvents ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3 text-zinc-500">
                  <RefreshCw className="h-6 w-6 animate-spin text-pink-500" />
                  <span className="text-xs">Streaming active events...</span>
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-2 text-zinc-600">
                  <Activity className="h-8 w-8 text-zinc-800" />
                  <span className="text-xs">No events found matching current criteria.</span>
                </div>
              ) : (
                <div className="relative border-l border-zinc-900 ml-3 space-y-5">
                  {filteredEvents.map((evt) => (
                    <div key={evt.id} className="relative pl-6 group">
                      
                      {/* Chrono Dot indicator */}
                      <span className={`absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-zinc-950 flex items-center justify-center ${
                        evt.type === 'Warning' 
                          ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]' 
                          : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                      }`} />

                      <div className={`p-3 rounded-xl border transition-all duration-200 bg-zinc-900/30 ${
                        evt.type === 'Warning'
                          ? 'border-amber-500/10 hover:border-amber-500/30 hover:bg-amber-950/5'
                          : 'border-zinc-800/80 hover:border-emerald-500/20 hover:bg-emerald-950/5'
                      }`}>
                        
                        {/* Event Core details header */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-extrabold uppercase tracking-wider ${
                              evt.type === 'Warning' ? 'text-amber-400' : 'text-emerald-400'
                            }`}>
                              {evt.reason}
                            </span>
                            <Badge variant="outline" className="text-[9px] py-0 px-1.5 border-zinc-800 bg-zinc-900 text-zinc-400">
                              {evt.resourceKind}
                            </Badge>
                            <span className="font-mono text-[10px] text-zinc-300 font-bold">{evt.resourceName}</span>
                          </div>
                          <span className="text-[9px] text-zinc-500">
                            {new Date(evt.lastTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>

                        {/* Event Message */}
                        <p className="text-xs text-zinc-400 mt-2 leading-relaxed font-mono bg-zinc-950/20 p-2 rounded border border-zinc-900/40">
                          {evt.message}
                        </p>

                        {/* Metadata Footer */}
                        <div className="flex items-center justify-between mt-3 text-[9px] text-zinc-500">
                          <div className="flex items-center gap-3">
                            <span>Namespace: <strong className="text-zinc-400">{evt.namespace}</strong></span>
                            <span>Source Component: <strong className="text-zinc-400">{evt.source}</strong></span>
                          </div>
                          <div className="flex items-center gap-1 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 text-zinc-400">
                            <span>Count:</span>
                            <strong className="text-zinc-200">{evt.count}</strong>
                          </div>
                        </div>

                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: AI Diagnostic Assistant */}
        <div className="lg:col-span-1 flex flex-col gap-4 min-h-0">
          <Card className="bg-zinc-950 border-zinc-800/80 shadow-2xl flex flex-col min-h-0 flex-1">
            <CardHeader className="p-4 shrink-0 border-b border-zinc-800">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-zinc-300">
                <Zap className="h-4 w-4 text-pink-500" />
                Rule-Based Diagnostic AI
              </CardTitle>
              <CardDescription className="text-xs text-zinc-500">
                Evaluate pending, stuck, or crashlooping pods with active root cause evidence.
              </CardDescription>
            </CardHeader>
            
            {/* Resource Selector panel */}
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/10 shrink-0 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Namespace</label>
                  <select
                    value={diagNamespace}
                    onChange={(e) => {
                      setDiagNamespace(e.target.value);
                      setSelectedPodName('');
                      setTriggerDiagnostic(false);
                    }}
                    className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none"
                  >
                    {namespaces?.map((ns: { name: string }) => (
                      <option key={ns.name} value={ns.name}>{ns.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Select Pod</label>
                  <select
                    value={selectedPodName}
                    onChange={(e) => {
                      setSelectedPodName(e.target.value);
                      setTriggerDiagnostic(false);
                    }}
                    disabled={!pods || pods.length === 0}
                    className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none disabled:opacity-50"
                  >
                    {!pods || pods.length === 0 ? (
                      <option>No pods found</option>
                    ) : (
                      pods.map((p: { name: string }) => (
                        <option key={p.name} value={p.name}>{p.name}</option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <Button
                size="sm"
                onClick={handleRunDiagnosis}
                disabled={!selectedPodName || (triggerDiagnostic && loadingDiagnosis)}
                className="w-full bg-pink-600 hover:bg-pink-500 text-zinc-950 font-bold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(236,72,153,0.15)]"
              >
                {(triggerDiagnostic && loadingDiagnosis) ? (
                  <RefreshCw className="h-4 w-4 animate-spin text-zinc-950" />
                ) : (
                  <ShieldCheck className="h-4 w-4 text-zinc-950" />
                )}
                Diagnose Resource
              </Button>
            </div>

            {/* Diagnostic Engine Outcome display */}
            <div className="flex-1 overflow-y-auto p-4 min-h-0 bg-zinc-950/40">
              {(triggerDiagnostic && loadingDiagnosis) ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3 text-zinc-500">
                  <RefreshCw className="h-6 w-6 animate-spin text-pink-500" />
                  <span className="text-xs">AI diagnostic logic running...</span>
                </div>
              ) : triggerDiagnostic && diagnosis ? (
                <div className="space-y-4 animate-fadeIn">
                  
                  {/* Status Banner */}
                  <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
                    diagnosis.status === 'Critical'
                      ? 'bg-rose-950/20 border-rose-500/20 text-rose-200'
                      : diagnosis.status === 'Warning'
                      ? 'bg-amber-950/20 border-amber-500/20 text-amber-200'
                      : 'bg-emerald-950/20 border-emerald-500/20 text-emerald-200'
                  }`}>
                    {diagnosis.status === 'Critical' ? (
                      <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 animate-bounce" />
                    ) : diagnosis.status === 'Warning' ? (
                      <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                    )}
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-black uppercase tracking-wider">
                        DIAGNOSIS {diagnosis.status}
                      </span>
                      <p className="text-[10px] leading-relaxed text-zinc-400">{diagnosis.summary}</p>
                    </div>
                  </div>

                  {/* Findings */}
                  {diagnosis.findings && diagnosis.findings.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Findings</span>
                      {diagnosis.findings.map((f, i) => (
                        <div key={i} className={`p-3 rounded-lg border text-xs space-y-1 ${
                          f.severity === 'error'
                            ? 'bg-rose-950/10 border-rose-900/30'
                            : f.severity === 'warning'
                            ? 'bg-amber-950/10 border-amber-900/30'
                            : 'bg-zinc-900/40 border-zinc-800/80'
                        }`}>
                          <h4 className={`font-semibold ${
                            f.severity === 'error' ? 'text-rose-400' : f.severity === 'warning' ? 'text-amber-400' : 'text-zinc-300'
                          }`}>{f.title}</h4>
                          <p className="text-[10px] text-zinc-500 leading-relaxed">{f.description}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Evidence Cards */}
                  {diagnosis.evidence && diagnosis.evidence.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Runtime Evidence</span>
                      {diagnosis.evidence.map((e, i) => (
                        <div key={i} className="p-3 rounded-lg bg-zinc-950 border border-zinc-900 text-[10px] space-y-1.5">
                          <span className="font-semibold text-zinc-400 flex items-center gap-1">
                            <ChevronRight className="h-3 w-3 text-pink-500" />
                            {e.source}
                          </span>
                          <pre className="font-mono text-zinc-500 overflow-x-auto bg-zinc-900/30 p-2 rounded leading-relaxed text-[9px] whitespace-pre-wrap">
                            {e.content}
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Remediation Cards */}
                  {diagnosis.remediation && diagnosis.remediation.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Actionable Remediation</span>
                      {diagnosis.remediation.map((r, i) => (
                        <div key={i} className="p-3 rounded-lg border border-pink-500/10 bg-pink-950/5 text-xs space-y-2">
                          <p className="text-[10px] text-zinc-300 leading-relaxed">{r.description}</p>
                          <div className="space-y-1.5">
                            {r.commands.map((cmd, ci) => (
                              <div key={ci} className="bg-zinc-950 rounded border border-zinc-800 p-2 font-mono text-[9px] text-zinc-400 flex items-center justify-between group/cmd">
                                <span className="overflow-x-auto whitespace-nowrap scrollbar-none pr-3 select-all">{cmd}</span>
                                <button 
                                  onClick={() => navigator.clipboard.writeText(cmd)}
                                  className="text-zinc-600 hover:text-zinc-300 transition-colors shrink-0"
                                  title="Copy command"
                                >
                                  <ClipboardCheck className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 gap-2 text-zinc-600">
                  <Terminal className="h-8 w-8 text-zinc-700" />
                  <span className="text-xs">No active diagnosis. Click &quot;Diagnose Resource&quot; to query Pod data.</span>
                </div>
              )}
            </div>

          </Card>
        </div>

      </div>
    </div>
  );
}
