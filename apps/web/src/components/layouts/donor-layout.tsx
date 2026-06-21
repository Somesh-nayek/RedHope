'use client';

import type { ReactNode } from 'react';
import { Bell, CalendarDays, ClipboardList, History, LayoutDashboard } from 'lucide-react';
import { RoleLayout } from '../role-layout';
import { useUnreadNotificationCount } from '@/lib/notification-api';

export function DonorLayout({ children }: { children: ReactNode }) {
  const { data } = useUnreadNotificationCount();
  const navigation = [
    { label: 'Dashboard', href: '/donor/dashboard', icon: LayoutDashboard },
    { label: 'Blood Requests', href: '/donor/requests', icon: ClipboardList },
    { label: 'Donation Camps', href: '/donor/camps', icon: CalendarDays },
    { label: 'Donation History', href: '/donor/history', icon: History },
    {
      label: 'Notifications',
      href: '/notifications',
      icon: Bell,
      badge: data?.count
    }
  ];

  return (
    <RoleLayout section="Donor Portal" navigation={navigation}>
      {children}
    </RoleLayout>
  );
}
