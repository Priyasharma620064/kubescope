import {
  Server,
  ScrollText,
  BarChart3,
  AlertTriangle,
  Activity,
  Cpu,
  HardDrive,
  Layers,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Dashboard status card with icon and animated value display.
 */
function StatusCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-border/80 transition-colors">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`rounded-lg p-2 ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

/**
 * Module quick-access card for the dashboard grid.
 */
function ModuleCard({
  title,
  description,
  icon: Icon,
  href,
  gradient,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  gradient: string;
}) {
  return (
    <a href={href} className="group block">
      <Card className="h-full border-border/50 bg-card/50 backdrop-blur-sm hover:border-border/80 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5">
        <CardContent className="pt-6">
          <div
            className={`mb-4 inline-flex rounded-xl p-3 ${gradient}`}
          >
            <Icon className="h-5 w-5 text-white" />
          </div>
          <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {description}
          </p>
        </CardContent>
      </Card>
    </a>
  );
}

/**
 * Dashboard home page — cluster overview with status cards and module quick access.
 */
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Cluster overview and operational health
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusCard
          title="Total Pods"
          value={12}
          subtitle="3 namespaces"
          icon={Layers}
          color="bg-indigo-500/10 text-indigo-400"
        />
        <StatusCard
          title="Running"
          value={9}
          subtitle="75% of total"
          icon={Activity}
          color="bg-emerald-500/10 text-emerald-400"
        />
        <StatusCard
          title="Pending"
          value={2}
          subtitle="Resource constraints"
          icon={Cpu}
          color="bg-amber-500/10 text-amber-400"
        />
        <StatusCard
          title="Warnings"
          value={3}
          subtitle="Last 1 hour"
          icon={AlertTriangle}
          color="bg-rose-500/10 text-rose-400"
        />
      </div>

      {/* Module Quick Access */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ModuleCard
            title="Cluster Explorer"
            description="Browse namespaces, pods, deployments, and nodes with real-time status indicators."
            icon={Server}
            href="/cluster"
            gradient="bg-gradient-to-br from-blue-500 to-cyan-600"
          />
          <ModuleCard
            title="Live Logs"
            description="Stream pod logs in real-time with search, filtering, and level highlighting."
            icon={ScrollText}
            href="/logs"
            gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          />
          <ModuleCard
            title="Metrics Dashboard"
            description="CPU, memory usage charts, restart tracking, and node health monitoring."
            icon={BarChart3}
            href="/metrics"
            gradient="bg-gradient-to-br from-violet-500 to-purple-600"
          />
          <ModuleCard
            title="YAML Studio"
            description="Edit Kubernetes resources with schema validation and live diff preview."
            icon={HardDrive}
            href="/yaml-studio"
            gradient="bg-gradient-to-br from-orange-500 to-red-600"
          />
          <ModuleCard
            title="Event Timeline"
            description="Visual timeline of cluster events with severity filtering and correlation."
            icon={Activity}
            href="/events"
            gradient="bg-gradient-to-br from-pink-500 to-rose-600"
          />
          <ModuleCard
            title="AI Assistant"
            description="Rule-based diagnostic engine for debugging scheduling failures and issues."
            icon={AlertTriangle}
            href="/assistant"
            gradient="bg-gradient-to-br from-indigo-500 to-blue-600"
          />
        </div>
      </div>
    </div>
  );
}
