'use client';

import { Users } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { PageContainer } from '@/components/page-container';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { formatDate } from '@/lib/formatters';
import { useAdminUsers, useUpdateAdminUserStatus, type UserStatus } from '@/lib/admin-api';

export default function AdminUsersPage() {
  const users = useAdminUsers();
  const updateStatus = useUpdateAdminUserStatus();

  if (users.isLoading) return <LoadingState label="Loading users..." />;
  if (users.isError) return <ErrorState message={users.error.message} />;

  const data = users.data ?? [];

  return (
    <PageContainer title="Users" description="Activate or suspend platform accounts without deleting history.">
      {data.length === 0 ? (
        <EmptyState icon={Users} title="No users found" description="Registered users will appear here." />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-xs text-muted-foreground">{user.phoneNumber ?? 'No phone'}</div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    <StatusBadge status={user.status} />
                  </TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus.mutate({ id: user.id, status: 'ACTIVE' })}
                        disabled={updateStatus.isPending || user.status === 'ACTIVE'}
                      >
                        Activate
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus.mutate({ id: user.id, status: 'SUSPENDED' })}
                        disabled={updateStatus.isPending || user.status === 'SUSPENDED'}
                      >
                        Suspend
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </PageContainer>
  );
}

function StatusBadge({ status }: { status: UserStatus }) {
  const tone =
    status === 'ACTIVE'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : status === 'SUSPENDED'
        ? 'border-red-200 bg-red-50 text-red-700'
        : 'border-amber-200 bg-amber-50 text-amber-700';

  return <span className={'rounded-full border px-2.5 py-1 text-xs font-medium ' + tone}>{status}</span>;
}
