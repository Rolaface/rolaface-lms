import { useEffect, useState, type ReactNode } from 'react';
import { AppShell } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { Sidebar } from '../components/Sidebar';
import { ModalHost } from '../store/modal store/ModalHost';
import { MinimizedChipStack } from '../components/shared/MinimizedChipStack';
import '../store/modal store/registerModals'; 

export function AppLayout({ children }: { children: ReactNode }) {
  const isTabletDown = useMediaQuery('(max-width: 64em)');

  const [manualOverride, setManualOverride] = useState<boolean | null>(null);
  const isCollapsed = manualOverride ?? isTabletDown ?? false;

  useEffect(() => {
    setManualOverride(null);
  }, [isTabletDown]);

 return (
  <AppShell
    navbar={{
      width: isCollapsed ? 80 : 240,
      breakpoint: 'sm',
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
      <ModalHost />
    </AppShell.Main>

    <MinimizedChipStack />
  </AppShell>
);
}