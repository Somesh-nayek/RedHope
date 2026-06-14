'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { dashboardPathFor, useAuth } from '@/lib/auth-context';
import { LoadingState } from '@/components/loading-state';

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    router.replace(user ? dashboardPathFor(user) : '/login');
  }, [isLoading, router, user]);

  return <LoadingState fullPage label="Opening your dashboard..." />;
}
