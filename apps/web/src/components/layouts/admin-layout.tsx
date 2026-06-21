'use client';

import type { ReactNode } from 'react';
import { BarChart3, Building2, CalendarDays, LayoutDashboard, Users } from 'lucide-react';
import { RoleLayout } from '../role-layout';

const navigation = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Hospitals', href: '/admin/hospitals', icon: Building2 },
  { label: 'Camps', href: '/admin/camps', icon: CalendarDays },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 }
];

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RoleLayout section="Admin Portal" navigation={navigation}>
      {children}
    </RoleLayout>
  );
}
