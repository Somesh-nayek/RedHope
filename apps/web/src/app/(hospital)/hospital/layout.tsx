import type { ReactNode } from 'react';
import { ProtectedRoute } from '@/components/protected-route';
import { HospitalLayout } from '@/components/layouts/hospital-layout';

export default function HospitalRouteLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requiredRole="HOSPITAL" requireHospitalApproval>
      <HospitalLayout>{children}</HospitalLayout>
    </ProtectedRoute>
  );
}
