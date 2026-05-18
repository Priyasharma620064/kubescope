'use client';

import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc-client';
import Editor from '@monaco-editor/react';
import { 
  FileCode2, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Terminal, 
  RefreshCw,
  FolderOpen,
  Info
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface ValidationError {
  path?: string;
  message: string;
  severity: 'error' | 'warning';
}

interface ValidationData {
  isValid: boolean;
  errors: ValidationError[];
  parsedObjects: Array<{
    kind?: string;
    metadata?: {
      name?: string;
      namespace?: string;
    };
  }>;
}

interface ApplyData {
  success: boolean;
  message: string;
  appliedResources: Array<{
    kind: string;
    name: string;
    namespace?: string;
    status: string;
  }>;
}

export default function YamlStudioPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('pod');
  const [editorValue, setEditorValue] = useState('');
  const [activeRightTab, setActiveRightTab] = useState<'validation' | 'logs'>('validation');
  
  // States for dry-run and apply
  const [dryRunRunning, setDryRunRunning] = useState(false);
  const [applyRunning, setApplyRunning] = useState(false);
  const [dryRunResult, setDryRunResult] = useState<ValidationData | null>(null);
  const [applyResult, setApplyResult] = useState<ApplyData | null>(null);

  // Queries & Mutations
  const { data: templates, isLoading: loadingTemplates } = trpc.yaml.listTemplates.useQuery();
  const validateMutation = trpc.yaml.validate.useMutation();
  const applyMutation = trpc.yaml.apply.useMutation();

  // Set default editor value when templates load
  useEffect(() => {
    if (templates && templates.length > 0) {
      const defaultTpl = templates.find(t => t.id === selectedTemplateId) || templates[0];
      setEditorValue(defaultTpl.yaml);
    }
  }, [templates, selectedTemplateId]);

  // SSR safety
  useEffect(() => {
    setMounted(true);
  }, []);

  const selectTemplate = (id: string, yamlContent: string) => {
    setSelectedTemplateId(id);
    setEditorValue(yamlContent);
    setDryRunResult(null);
    setApplyResult(null);
  };

  const handleDryRunValidate = async () => {
    if (!editorValue) return;
    setDryRunRunning(true);
    setDryRunResult(null);
    setActiveRightTab('validation');

    try {
      const res = await validateMutation.mutateAsync({
        yaml: editorValue,
        dryRun: true
      });
      setDryRunResult(res as ValidationData);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Validation failed due to tRPC error.';
      setDryRunResult({
        isValid: false,
        errors: [{ message: errMsg, severity: 'error' }],
        parsedObjects: []
      });
    } finally {
      setDryRunRunning(false);
    }
  };

  const handleApplyManifests = async () => {
    if (!editorValue) return;
    setApplyRunning(true);
    setApplyResult(null);
    setActiveRightTab('logs');

    try {
      const res = await applyMutation.mutateAsync({
        yaml: editorValue
      });
      setApplyResult(res as ApplyData);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to apply manifest.';
      setApplyResult({
        success: false,
        message: errMsg,
        appliedResources: []
      });
    } finally {
      setApplyRunning(false);
    }
  };

  if (!mounted) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-neutral-800 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[75vh]">
          <div className="lg:col-span-1 bg-neutral-800 rounded-lg" />
          <div className="lg:col-span-3 bg-neutral-800 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-6rem)]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileCode2 className="h-6 w-6 text-amber-500 animate-pulse" />
            Monaco YAML Studio
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Author, structurally validate, dry-run, and apply Kubernetes resources with schema diagnostics.
          </p>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDryRunValidate}
            disabled={dryRunRunning || applyRunning || !editorValue}
            className="border-zinc-800 hover:bg-zinc-900 flex items-center gap-2 text-zinc-300"
          >
            {dryRunRunning ? (
              <RefreshCw className="h-4 w-4 animate-spin text-amber-500" />
            ) : (
              <Info className="h-4 w-4 text-amber-500" />
            )}
            Dry-Run Validate
          </Button>

          <Button
            size="sm"
            onClick={handleApplyManifests}
            disabled={applyRunning || dryRunRunning || !editorValue}
            className="bg-amber-600 hover:bg-amber-500 text-zinc-950 font-medium flex items-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
          >
            {applyRunning ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4 fill-zinc-950 text-zinc-950" />
            )}
            Apply Resources
          </Button>
        </div>
      </div>

      <Separator className="bg-zinc-800/80 shrink-0" />

      {/* Main Studio Workspace Splitter */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0 flex-1">
        {/* Left Template Selection Panel */}
        <div className="lg:col-span-1 flex flex-col gap-4 min-h-0">
          <Card className="bg-zinc-950 border-zinc-800/80 shadow-2xl flex flex-col min-h-0 flex-1">
            <CardHeader className="p-4 shrink-0">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-zinc-300">
                <FolderOpen className="h-4 w-4 text-amber-500" />
                Resource Templates
              </CardTitle>
              <CardDescription className="text-xs text-zinc-500">
                Select a manifest template to load in the Monaco workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 pt-0 flex-1 overflow-y-auto space-y-2">
              {loadingTemplates ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map(n => (
                    <div key={n} className="h-16 bg-zinc-900 rounded-lg animate-pulse border border-zinc-800/40" />
                  ))}
                </div>
              ) : (
                templates?.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => selectTemplate(tpl.id, tpl.yaml)}
                    className={`w-full text-left p-3 rounded-lg border transition-all duration-200 flex flex-col gap-1 ${
                      selectedTemplateId === tpl.id
                        ? 'bg-amber-950/20 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.05)]'
                        : 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900/80 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold ${selectedTemplateId === tpl.id ? 'text-amber-400' : 'text-zinc-300'}`}>
                        {tpl.name}
                      </span>
                      <Badge variant="outline" className="text-[10px] py-0 px-1 border-zinc-800 bg-zinc-900 text-zinc-400">
                        {tpl.id.toUpperCase()}
                      </Badge>
                    </div>
                    <span className="text-[10px] text-zinc-500 line-clamp-2 leading-relaxed">
                      {tpl.description}
                    </span>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Central-Right Editor & Preview Columns */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-5 gap-6 min-h-0">
          
          {/* Monaco Workspace Panel */}
          <Card className="md:col-span-3 bg-zinc-950 border-zinc-800/80 shadow-2xl flex flex-col min-h-0">
            <div className="flex items-center justify-between p-3 border-b border-zinc-800 shrink-0 bg-zinc-900/40">
              <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-amber-500" />
                workspace.yaml
              </span>
              <Badge variant="outline" className="text-[9px] text-zinc-400 border-zinc-800 bg-zinc-900">
                Monaco Editor
              </Badge>
            </div>
            <div className="flex-1 min-h-0 w-full relative">
              <Editor
                height="100%"
                language="yaml"
                theme="vs-dark"
                value={editorValue}
                onChange={(value) => setEditorValue(value || '')}
                loading={
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 gap-3 text-zinc-400">
                    <RefreshCw className="h-8 w-8 animate-spin text-amber-500" />
                    <span className="text-xs font-semibold tracking-wider animate-pulse">BOOTING MONACO WORKSPACE...</span>
                  </div>
                }
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: 'on',
                  roundedSelection: true,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: { top: 12, bottom: 12 },
                  cursorBlinking: 'smooth',
                  cursorSmoothCaretAnimation: 'on',
                  renderLineHighlight: 'all',
                  scrollbar: {
                    verticalScrollbarSize: 8,
                    horizontalScrollbarSize: 8,
                  }
                }}
              />
            </div>
          </Card>

          {/* Validation & Applied Output Panel */}
          <Card className="md:col-span-2 bg-zinc-950 border-zinc-800/80 shadow-2xl flex flex-col min-h-0">
            {/* Panel Tabs */}
            <div className="flex border-b border-zinc-800 shrink-0 bg-zinc-900/40">
              <button
                onClick={() => setActiveRightTab('validation')}
                className={`flex-1 py-3 text-xs font-semibold transition-all duration-200 border-b-2 flex items-center justify-center gap-1.5 ${
                  activeRightTab === 'validation'
                    ? 'border-amber-500 text-amber-400 bg-zinc-900/20'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Dry-Run Validation
              </button>
              <button
                onClick={() => setActiveRightTab('logs')}
                className={`flex-1 py-3 text-xs font-semibold transition-all duration-200 border-b-2 flex items-center justify-center gap-1.5 ${
                  activeRightTab === 'logs'
                    ? 'border-amber-500 text-amber-400 bg-zinc-900/20'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Terminal className="h-3.5 w-3.5" />
                Applied Status
              </button>
            </div>

            {/* Tab content view */}
            <div className="flex-1 overflow-y-auto p-4 min-h-0 bg-zinc-950/40">
              
              {/* Validation Tab */}
              {activeRightTab === 'validation' && (
                <div className="space-y-4">
                  {dryRunRunning ? (
                    <div className="flex flex-col items-center justify-center h-48 gap-3 text-zinc-500">
                      <RefreshCw className="h-6 w-6 animate-spin text-amber-500" />
                      <span className="text-xs">Executing server dry-run apply...</span>
                    </div>
                  ) : dryRunResult ? (
                    <div className="space-y-4">
                      {dryRunResult.isValid ? (
                        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/10 shadow-[0_0_15px_rgba(16,185,129,0.05)] space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-emerald-950/60 flex items-center justify-center border border-emerald-500/30">
                              <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400" />
                            </div>
                            <div>
                              <h3 className="text-xs font-semibold text-emerald-400">PASSED DRY-RUN APPLY</h3>
                              <p className="text-[10px] text-zinc-500 mt-0.5">Manifest syntax and K8s schema verified successfully.</p>
                            </div>
                          </div>
                          <Separator className="bg-zinc-800/60" />
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-semibold text-zinc-400">Validated Resources:</span>
                            {dryRunResult.parsedObjects?.map((obj, i) => (
                              <div key={i} className="flex items-center justify-between text-[10px] bg-zinc-900/50 p-2 rounded border border-zinc-800/40">
                                <span className="font-mono text-zinc-300">{obj.kind}/{obj.metadata?.name}</span>
                                <Badge variant="outline" className="text-[9px] py-0 px-1 border-emerald-800 text-emerald-400 bg-emerald-950/20">
                                  Valid Schema
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-950/10 shadow-[0_0_15px_rgba(244,63,94,0.05)] space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-rose-950/60 flex items-center justify-center border border-rose-500/30">
                              <AlertTriangle className="h-4.5 w-4.5 text-rose-400 animate-bounce" />
                            </div>
                            <div>
                              <h3 className="text-xs font-semibold text-rose-400">DRY-RUN FAILED</h3>
                              <p className="text-[10px] text-zinc-500 mt-0.5">Correct the schema/quota errors listed below.</p>
                            </div>
                          </div>
                          <Separator className="bg-zinc-800/60" />
                          <div className="space-y-2.5">
                            {dryRunResult.errors?.map((err, i) => (
                              <div key={i} className="bg-rose-950/20 p-2.5 rounded border border-rose-900/30 space-y-1 text-xs">
                                <div className="flex items-center justify-between">
                                  <span className="text-[9px] font-bold text-rose-400 uppercase tracking-wider">
                                    {err.severity}
                                  </span>
                                  {err.path && (
                                    <span className="text-[9px] font-mono text-zinc-500">
                                      {err.path}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-rose-200 leading-relaxed font-mono">
                                  {err.message}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 gap-2 text-zinc-600">
                      <Info className="h-8 w-8 text-zinc-700" />
                      <span className="text-xs">No Dry-Run results. Click &quot;Dry-Run Validate&quot; to evaluate specs.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Logs Tab */}
              {activeRightTab === 'logs' && (
                <div className="space-y-4">
                  {applyRunning ? (
                    <div className="flex flex-col items-center justify-center h-48 gap-3 text-zinc-500">
                      <RefreshCw className="h-6 w-6 animate-spin text-amber-500" />
                      <span className="text-xs">Applying manifests to active cluster...</span>
                    </div>
                  ) : applyResult ? (
                    <div className="space-y-4">
                      {applyResult.success ? (
                        <div className="space-y-4">
                          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-950/10 shadow-[0_0_15px_rgba(245,158,11,0.05)] space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-amber-950/60 flex items-center justify-center border border-amber-500/30">
                                <CheckCircle2 className="h-4.5 w-4.5 text-amber-400" />
                              </div>
                              <div>
                                <h3 className="text-xs font-semibold text-amber-400">APPLY SUCCESSFUL</h3>
                                <p className="text-[10px] text-zinc-500 mt-0.5">Resources have been synchronized to cluster context.</p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <span className="text-[10px] font-semibold text-zinc-400">Resource Apply logs:</span>
                            {applyResult.appliedResources?.map((res, i) => (
                              <div key={i} className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/60 flex items-center justify-between text-xs">
                                <div className="space-y-0.5">
                                  <div className="font-mono text-zinc-200">{res.kind}/{res.name}</div>
                                  <div className="text-[9px] text-zinc-500">Namespace: {res.namespace || 'default'}</div>
                                </div>
                                <Badge className="bg-emerald-950 border-emerald-800 text-emerald-400 text-[9px] py-0 px-1.5 font-bold uppercase tracking-wider">
                                  {res.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-950/10 space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-rose-950/60 flex items-center justify-center border border-rose-500/30">
                              <AlertTriangle className="h-4.5 w-4.5 text-rose-400" />
                            </div>
                            <div>
                              <h3 className="text-xs font-semibold text-rose-400">APPLY REJECTED</h3>
                              <p className="text-[10px] text-zinc-500 mt-0.5">Synchronizing resource state failed.</p>
                            </div>
                          </div>
                          <Separator className="bg-zinc-800/60" />
                          <p className="text-[10px] text-rose-300 leading-relaxed font-mono bg-rose-950/30 p-2.5 rounded border border-rose-900/30">
                            {applyResult.message}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 gap-2 text-zinc-600">
                      <Terminal className="h-8 w-8 text-zinc-700" />
                      <span className="text-xs">No applied status logs. Click &quot;Apply Resources&quot; to configure cluster.</span>
                    </div>
                  )}
                </div>
              )}

            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}
