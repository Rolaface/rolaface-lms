import type { ReactNode } from 'react';
import { AppShell } from '@mantine/core';
import { Sidebar } from '../components/Sidebar';

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell
      navbar={{ width: 240, breakpoint: 'sm' }}
      padding={0}
    >
      <AppShell.Navbar className="border-r border-gray-100">
        <Sidebar />
      </AppShell.Navbar>

      <AppShell.Main className="min-h-screen bg-[#F8F9FB]">
        {children}
      </AppShell.Main>
    </AppShell>
  );
}