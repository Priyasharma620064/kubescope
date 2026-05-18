import { useEffect, useState, useRef, useCallback } from 'react';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'UNKNOWN';

export interface LogLine {
  id: string;
  timestamp: string | null;
  level: LogLevel;
  content: string;
  raw: string;
}

export type StreamStatus = 'connecting' | 'connected' | 'paused' | 'disconnected' | 'error';

interface UseLogStreamOptions {
  namespace: string | null;
  pod: string | null;
  container: string | null;
  previous?: boolean;
  tail?: number;
  maxBufferLines?: number;
}

function parseLogLevel(line: string): { level: LogLevel; cleanContent: string; timestamp: string | null } {
  // ISO-8601 Timestamp regex matching: 2026-05-18T05:39:15.123Z
  const tsRegex = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z|\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)\s*/;
  const tsMatch = line.match(tsRegex);
  
  let timestamp: string | null = null;
  let remaining = line;
  
  if (tsMatch) {
    timestamp = tsMatch[1];
    remaining = line.substring(tsMatch[0].length);
  }
  
  // Look for levels: [INFO], [WARN], [ERROR], [DEBUG] or INFO, WARN, ERROR, DEBUG
  const levelRegex = /\[?(INFO|WARN|WARNING|ERROR|ERR|DEBUG)\]?\s*/i;
  const levelMatch = remaining.match(levelRegex);
  
  let level: LogLevel = 'UNKNOWN';
  let cleanContent = remaining;
  
  if (levelMatch) {
    const rawLevel = levelMatch[1].toUpperCase();
    if (rawLevel === 'ERR') level = 'ERROR';
    else if (rawLevel === 'WARNING') level = 'WARN';
    else level = rawLevel as LogLevel;
    
    cleanContent = remaining.substring(levelMatch[0].length);
  }
  
  return { level, cleanContent, timestamp };
}

export function useLogStream({
  namespace,
  pod,
  container,
  previous = false,
  tail = 200,
  maxBufferLines = 2000,
}: UseLogStreamOptions) {
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [status, setStatus] = useState<StreamStatus>('disconnected');
  const [filterText, setFilterText] = useState('');
  const [useRegex, setUseRegex] = useState(false);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const isPausedRef = useRef(false);
  const logCounterRef = useRef(0);
  
  // Real-time raw logs buffer for downloading complete logs regardless of pause
  const rawLogsBufferRef = useRef<string[]>([]);

  const connect = useCallback(() => {
    if (!namespace || !pod || !container) return;
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
    setStatus('connecting');
    isPausedRef.current = false;
    
    const params = new URLSearchParams({
      namespace,
      pod,
      container,
      previous: String(previous),
      tail: String(tail),
    });
    
    const url = `/api/logs/stream?${params.toString()}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;
    
    es.onopen = () => {
      setStatus('connected');
      setLogs([]);
      rawLogsBufferRef.current = [];
    };
    
    es.onerror = (e) => {
      console.error('[Kubescope] EventSource encountered error:', e);
      setStatus('error');
      es.close();
    };
    
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.log) {
          const rawLine = data.log;
          
          // Append to full raw log buffer for download/reference
          rawLogsBufferRef.current.push(rawLine);
          
          if (isPausedRef.current) return;
          
          const { level, cleanContent, timestamp } = parseLogLevel(rawLine);
          logCounterRef.current += 1;
          
          const parsedLine: LogLine = {
            id: `${Date.now()}-${logCounterRef.current}`,
            timestamp,
            level,
            content: cleanContent.trim(),
            raw: rawLine,
          };
          
          setLogs((prev) => {
            const next = [...prev, parsedLine];
            if (next.length > maxBufferLines) {
              return next.slice(next.length - maxBufferLines);
            }
            return next;
          });
        }
      } catch (err) {
        console.error('[Kubescope] Failed to parse log event:', err);
      }
    };
  }, [namespace, pod, container, previous, tail, maxBufferLines]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setStatus('disconnected');
  }, []);

  const pause = useCallback(() => {
    isPausedRef.current = true;
    setStatus('paused');
  }, []);

  const resume = useCallback(() => {
    isPausedRef.current = false;
    setStatus('connected');
  }, []);

  const clear = useCallback(() => {
    setLogs([]);
    rawLogsBufferRef.current = [];
  }, []);

  const download = useCallback(() => {
    const content = rawLogsBufferRef.current.join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pod || 'pod'}_${container || 'container'}_logs.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [pod, container]);

  // Connect on mount or parameter change
  useEffect(() => {
    connect();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [connect]);

  // Filter logs locally in real-time
  const filteredLogs = logs.filter((log) => {
    if (!filterText) return true;
    
    if (useRegex) {
      try {
        const regex = new RegExp(filterText, 'i');
        return regex.test(log.raw);
      } catch {
        return false; // Invalid regex returns false
      }
    }
    
    return log.raw.toLowerCase().includes(filterText.toLowerCase());
  });

  return {
    logs: filteredLogs,
    allBufferLogs: logs,
    status,
    filterText,
    setFilterText,
    useRegex,
    setUseRegex,
    pause,
    resume,
    clear,
    download,
    disconnect,
    reconnect: connect,
  };
}
