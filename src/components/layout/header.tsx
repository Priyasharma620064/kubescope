'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, Command, Menu } from 'lucide-react';
import { APP_CONFIG } from '@/lib/constants';

interface HeaderProps {
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
  onOpenCommandPalette: () => void;
  onMobileMenuToggle: () => void;
}

/**
 * Top header bar with cluster connection status, demo mode toggle,
 * and command palette trigger.
 */
export function Header({
  isDemoMode,
  onToggleDemoMode,
  onOpenCommandPalette,
  onMobileMenuToggle,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-xl">
      {/* Left: Mobile menu + page context */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 lg:hidden"
          onClick={onMobileMenuToggle}
        >
          <Menu className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium text-muted-foreground hidden sm:block">
          {APP_CONFIG.description}
        </span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Command Palette Trigger */}
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground h-8 px-3 border-border/50"
          onClick={onOpenCommandPalette}
        >
          <Command className="h-3 w-3" />
          <span>Search...</span>
          <kbd className="ml-2 inline-flex h-5 items-center rounded border border-border/50 bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
            ⌘K
          </kbd>
        </Button>

        {/* Demo Mode Toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5"
          onClick={onToggleDemoMode}
        >
          {isDemoMode ? (
            <>
              <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs text-amber-400">DEMO</span>
            </>
          ) : (
            <>
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400">LIVE</span>
            </>
          )}
        </Button>

        {/* Connection Status */}
        <Badge
          variant="outline"
          className={
            isDemoMode
              ? 'border-amber-500/30 text-amber-400 bg-amber-500/10'
              : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
          }
        >
          {isDemoMode ? (
            <WifiOff className="h-3 w-3 mr-1" />
          ) : (
            <Wifi className="h-3 w-3 mr-1" />
          )}
          <span className="text-xs">
            {isDemoMode ? 'Demo Mode' : 'Connected'}
          </span>
        </Badge>
      </div>
    </header>
  );
}
