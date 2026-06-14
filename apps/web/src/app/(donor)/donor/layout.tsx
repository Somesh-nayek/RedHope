import type { ReactNode } from 'react';
import { ProtectedRoute } from '@/components/protected-route';
import { DonorLayout } from '@/components/layouts/donor-layout';

export default function DonorRouteLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requiredRole="DONOR">
      <DonorLayout>{children}</DonorLayout>
    </ProtectedRoute>
  );
}
