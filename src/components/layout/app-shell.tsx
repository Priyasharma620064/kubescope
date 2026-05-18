'use client';

import { useState } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { CommandPalette, useCommandPalette } from './command-palette';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * Root application shell that orchestrates the sidebar, header,
 * command palette, and main content area. Manages global UI state
 * like sidebar collapse, demo mode, and mobile menu.
 */
export function AppShell({ children }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const commandPalette = useCommandPalette();

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen bg-background">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>

        {/* Mobile Sidebar */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="w-[240px] p-0">
            <Sidebar
              collapsed={false}
              onToggle={() => setMobileMenuOpen(false)}
            />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <div
          className={cn(
            'flex flex-col transition-all duration-300',
            sidebarCollapsed ? 'lg:ml-[68px]' : 'lg:ml-[240px]'
          )}
        >
          <Header
            isDemoMode={isDemoMode}
            onToggleDemoMode={() => setIsDemoMode(!isDemoMode)}
            onOpenCommandPalette={() => commandPalette.setOpen(true)}
            onMobileMenuToggle={() => setMobileMenuOpen(true)}
          />

          <main className="flex-1 p-4 md:p-6">
            {children}
          </main>
        </div>

        {/* Command Palette */}
        <CommandPalette
          open={commandPalette.open}
          onOpenChange={commandPalette.setOpen}
        />
      </div>
    </TooltipProvider>
  );
}
