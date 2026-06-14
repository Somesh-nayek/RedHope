'use client';

import type { ReactNode } from 'react';
import { LayoutDashboard } from 'lucide-react';
import { RoleLayout } from '../role-layout';

const navigation = [
  { label: 'Dashboard', href: '/hospital/dashboard', icon: LayoutDashboard }
];

export function HospitalLayout({ children }: { children: ReactNode }) {
  return (
    <RoleLayout section="Hospital Portal" navigation={navigation}>
      {children}
    </RoleLayout>
  );
}
