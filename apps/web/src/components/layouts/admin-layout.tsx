'use client';

import type { ReactNode } from 'react';
import { LayoutDashboard } from 'lucide-react';
import { RoleLayout } from '../role-layout';

const navigation = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard }
];

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RoleLayout section="Admin Portal" navigation={navigation}>
      {children}
    </RoleLayout>
  );
}
