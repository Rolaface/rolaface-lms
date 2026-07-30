import { useEffect, useState, type ReactNode } from 'react';
import { AppShell } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { Sidebar } from '../components/Sidebar';

export function AppLayout({ children }: { children: ReactNode }) {
  // Below 1024px (lg), auto-shrink to icon-only. 64em matches the "lg"
  // breakpoint set in mantine.theme.ts (64em = 1024px).
  const isTabletDown = useMediaQuery('(max-width: 64em)');

  const [manualOverride, setManualOverride] = useState<boolean | null>(null);
  const isCollapsed = manualOverride ?? isTabletDown ?? false;

  // If the screen crosses the breakpoint, drop any manual override so the
  // sidebar re-syncs with the new screen size instead of getting "stuck".
  useEffect(() => {
    setManualOverride(null);
  }, [isTabletDown]);

  return (
    <AppShell
      navbar={{
        width: isCollapsed ? 80 : 240,
        breakpoint: 'sm',
        // Never let AppShell hide or overlay the navbar — it's always a
        // side column, at every screen size. Width is what changes, not visibility.
        collapsed: { mobile: false, desktop: false },
      }}
      padding={0}
      transitionDuration={300}
    >
      <AppShell.Navbar className="border-r border-gray-100">
        <Sidebar
          isCollapsed={isCollapsed}
          onToggle={() => setManualOverride(!isCollapsed)}
        />
      </AppShell.Navbar>

      <AppShell.Main className="h-screen bg-[#F8F9FB]">
        {children}
      </AppShell.Main>
    </AppShell>
  );
}