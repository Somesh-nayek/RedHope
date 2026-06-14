import type { ReactNode } from 'react';
import { ProtectedRoute } from '@/components/protected-route';
import { AdminLayout } from '@/components/layouts/admin-layout';

export default function AdminRouteLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AdminLayout>{children}</AdminLayout>
    </ProtectedRoute>
  );
}
