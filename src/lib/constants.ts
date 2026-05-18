import {
  LayoutDashboard,
  Server,
  ScrollText,
  BarChart3,
  FileCode2,
  CalendarClock,
  Bot,
  type LucideIcon,
} from 'lucide-react';

/**
 * Navigation items for the sidebar. Each maps to an app route.
 */
export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  description: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    description: 'Cluster overview and health status',
  },
  {
    title: 'Cluster Explorer',
    href: '/cluster',
    icon: Server,
    description: 'Browse namespaces, pods, deployments, and nodes',
  },
  {
    title: 'Live Logs',
    href: '/logs',
    icon: ScrollText,
    description: 'Real-time pod log streaming',
  },
  {
    title: 'Metrics',
    href: '/metrics',
    icon: BarChart3,
    description: 'CPU, memory, and observability dashboard',
  },
  {
    title: 'YAML Studio',
    href: '/yaml-studio',
    icon: FileCode2,
    description: 'Edit and validate Kubernetes resources',
  },
  {
    title: 'Events',
    href: '/events',
    icon: CalendarClock,
    description: 'Cluster event timeline',
  },
  {
    title: 'Assistant',
    href: '/assistant',
    icon: Bot,
    description: 'AI-powered cluster diagnostics',
  },
];

/**
 * Pod phase color mapping for consistent UI theming.
 */
export const POD_PHASE_COLORS: Record<string, string> = {
  Running: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  Pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Succeeded: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  Failed: 'bg-red-500/15 text-red-400 border-red-500/30',
  Unknown: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
  CrashLoopBackOff: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  ImagePullBackOff: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
};

/**
 * Node condition severity mapping.
 */
export const NODE_CONDITION_COLORS: Record<string, string> = {
  Ready: 'text-emerald-400',
  NotReady: 'text-red-400',
  MemoryPressure: 'text-amber-400',
  DiskPressure: 'text-orange-400',
  PIDPressure: 'text-rose-400',
  NetworkUnavailable: 'text-red-400',
};

/**
 * Log level colors for the log viewer.
 */
export const LOG_LEVEL_COLORS: Record<string, string> = {
  ERROR: 'text-red-400',
  WARN: 'text-amber-400',
  INFO: 'text-blue-400',
  DEBUG: 'text-gray-400',
  TRACE: 'text-gray-500',
  UNKNOWN: 'text-foreground',
};

/**
 * Event type colors for the timeline.
 */
export const EVENT_TYPE_COLORS: Record<string, string> = {
  Normal: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  Warning: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
};

/**
 * Chart color palette for Recharts.
 */
export const CHART_COLORS = {
  cpu: '#6366f1',        // Indigo
  memory: '#8b5cf6',     // Violet
  restarts: '#f43f5e',   // Rose
  latency: '#06b6d4',    // Cyan
  success: '#10b981',    // Emerald
  warning: '#f59e0b',    // Amber
  error: '#ef4444',      // Red
  grid: 'rgba(255, 255, 255, 0.06)',
} as const;

/**
 * Application metadata.
 */
export const APP_CONFIG = {
  name: 'KubeScope',
  description: 'Kubernetes Observability & Debugging Workbench',
  version: '0.1.0',
  metricsPollingInterval: 15_000,  // 15 seconds
  eventsPollingInterval: 10_000,   // 10 seconds
  logBufferMaxLines: 5_000,
} as const;
