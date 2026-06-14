'use client';

import type { ReactNode } from 'react';
import { Bell, CalendarDays, ClipboardList, History, LayoutDashboard } from 'lucide-react';
import { RoleLayout } from '../role-layout';
import { useDonorDashboard } from '@/lib/donor-api';

export function DonorLayout({ children }: { children: ReactNode }) {
  const { data } = useDonorDashboard();
  const navigation = [
    { label: 'Dashboard', href: '/donor/dashboard', icon: LayoutDashboard },
    { label: 'Blood Requests', href: '/donor/requests', icon: ClipboardList },
    { label: 'Donation Camps', href: '/donor/camps', icon: CalendarDays },
    { label: 'Donation History', href: '/donor/history', icon: History },
    {
      label: 'Notifications',
      href: '/donor/notifications',
      icon: Bell,
      badge: data?.unreadNotificationsCount
    }
  ];

  return (
    <RoleLayout section="Donor Portal" navigation={navigation}>
      {children}
    </RoleLayout>
  );
}
