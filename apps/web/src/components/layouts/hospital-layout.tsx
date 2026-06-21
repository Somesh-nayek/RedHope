'use client';

import type { ReactNode } from 'react';
import { BarChart3, CalendarDays, ClipboardList, LayoutDashboard, PackageOpen } from 'lucide-react';
import { RoleLayout } from '../role-layout';

const navigation = [
  { label: 'Dashboard', href: '/hospital/dashboard', icon: LayoutDashboard },
  { label: 'Inventory', href: '/hospital/inventory', icon: PackageOpen },
  { label: 'Requests', href: '/hospital/requests', icon: ClipboardList },
  { label: 'Camps', href: '/hospital/camps', icon: CalendarDays },
  { label: 'Analytics', href: '/hospital/analytics', icon: BarChart3 }
];

export function HospitalLayout({ children }: { children: ReactNode }) {
  return (
    <RoleLayout section="Hospital Portal" navigation={navigation}>
      {children}
    </RoleLayout>
  );
}
