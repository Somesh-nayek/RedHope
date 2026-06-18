'use client';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { useAuth, type UserRole } from '@/lib/auth-context';
import { LoadingState } from './loading-state';
import { EmptyState } from './empty-state';
import { Clock3 } from 'lucide-react';
interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole: UserRole;
  requireHospitalApproval?: boolean;
}

export function ProtectedRoute({
  children,
  requiredRole,
  requireHospitalApproval = false
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const isWrongRole = Boolean(user && user.role !== requiredRole);

  useEffect(() => {
    if (isLoading) return;
    if (!user) router.replace('/login');
    else if (isWrongRole) router.replace('/');
  }, [isLoading, isWrongRole, router, user]);

  if (isLoading || !user || isWrongRole) {
    return <LoadingState fullPage label="Checking access..." />;
  }

  if (
    requireHospitalApproval &&
    user.role === 'HOSPITAL' &&
    user.hospitalApproved !== true
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
        <EmptyState
          icon={Clock3}
          title="Awaiting Admin Approval"
          description="Your hospital account is registered and can sign in, but hospital features remain unavailable until an administrator approves it."
        />
      </div>
    );
  }
  return <>{children}</>;
}
