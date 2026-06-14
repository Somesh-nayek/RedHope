'use client';

import type { ReactNode } from 'react';
import { Header } from './header';
import { Sidebar, type NavigationItem } from './sidebar';

export function RoleLayout({
  section,
  navigation,
  children
}: {
  section: string;
  navigation: NavigationItem[];
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar items={navigation} />
      <div className="min-w-0 flex-1">
        <Header section={section} />
        {children}
      </div>
    </div>
  );
}
