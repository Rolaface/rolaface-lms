import { useState, type ReactNode } from 'react';
import { AppShell } from '@mantine/core';
import { Sidebar } from '../components/Sidebar';

export function AppLayout({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <AppShell
      navbar={{ width: isCollapsed ? 80 : 240, breakpoint: 'sm' }}
      padding={0}
      transitionDuration={300} // Adds a smooth transition to the layout shift
    >
      <AppShell.Navbar className="border-r border-gray-100">
        <Sidebar 
          isCollapsed={isCollapsed} 
          onToggle={() => setIsCollapsed(!isCollapsed)} 
        />
      </AppShell.Navbar>

      <AppShell.Main className="min-h-screen bg-[#F8F9FB]">
        {children}
      </AppShell.Main>
    </AppShell>
  );
}