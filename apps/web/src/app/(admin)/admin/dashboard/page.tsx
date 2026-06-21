'use client';

import { Activity, Building2, Droplets, HeartPulse, UserCheck, Users } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { PageContainer } from '@/components/page-container';
import { StatsCard } from '@/components/stats-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatBloodGroup, formatDate } from '@/lib/formatters';
import { useAdminDashboard, useApproveHospital, useRejectHospital } from '@/lib/admin-api';

export default function AdminDashboardPage() {
  const dashboard = useAdminDashboard();
  const approveHospital = useApproveHospital();
  const rejectHospital = useRejectHospital();

  if (dashboard.isLoading) return <LoadingState label="Loading admin dashboard..." />;
  if (dashboard.isError) return <ErrorState message={dashboard.error.message} />;

  const data = dashboard.data;
  if (!data) {
    return (
      <PageContainer
        title="Admin Dashboard"
        description="Platform-wide activity and account overview."
      >
        <EmptyState
          icon={Activity}
          title="No dashboard data"
          description="System activity will appear here once the platform has records."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Admin Dashboard"
      description="Platform-wide activity and account overview."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={String(data.totalUsers)}
          detail={data.totalDonors + ' donors registered'}
          icon={Users}
        />
        <StatsCard
          title="Hospitals"
          value={String(data.totalHospitals)}
          detail={data.approvedHospitals + ' approved'}
          icon={Building2}
        />
        <StatsCard
          title="Pending Approvals"
          value={String(data.pendingHospitals)}
          detail="Hospitals awaiting review"
          icon={UserCheck}
        />
        <StatsCard
          title="Active Requests"
          value={String(data.activeBloodRequests)}
          detail={data.totalDonations + ' donations recorded'}
          icon={HeartPulse}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pending Hospital Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            {data.pendingHospitalApprovals.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                No hospitals are waiting for approval.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hospital</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.pendingHospitalApprovals.map((hospital) => (
                    <TableRow key={hospital.id}>
                      <TableCell>
                        <div className="font-medium">{hospital.hospitalName}</div>
                        <div className="text-xs text-muted-foreground">{hospital.email}</div>
                      </TableCell>
                      <TableCell>
                        {hospital.city}, {hospital.state}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => approveHospital.mutate(hospital.id)}
                            disabled={approveHospital.isPending}
                          >
                            {approveHospital.isPending ? 'Approving...' : 'Approve'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectHospital.mutate(hospital.id)}
                            disabled={rejectHospital.isPending}
                          >
                            {rejectHospital.isPending ? 'Rejecting...' : 'Reject'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Blood Inventory Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {data.bloodInventorySummary.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                No inventory has been reported yet.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {data.bloodInventorySummary.map((item) => (
                  <div key={item.bloodGroup} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{formatBloodGroup(item.bloodGroup)}</span>
                      <Droplets className="size-4 text-primary" />
                    </div>
                    <div className="mt-2 text-2xl font-bold">{item.unitsAvailable}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.unitsReserved} reserved units
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <ActivityTable
          title="Recent Blood Requests"
          rows={data.recentBloodRequests.map((request) => ({
            id: request.id,
            primary: request.hospitalName,
            secondary:
              formatBloodGroup(request.bloodGroup) +
              ' • ' +
              request.unitsRequired +
              ' units • ' +
              request.urgency,
            meta: request.status + ' • ' + formatDate(request.createdAt),
          }))}
        />
        <ActivityTable
          title="Recent Donations"
          rows={data.recentDonations.map((donation) => ({
            id: donation.id,
            primary: donation.donorName,
            secondary: donation.hospitalName + ' • ' + formatBloodGroup(donation.bloodGroup),
            meta: formatDate(donation.donatedAt),
          }))}
        />
        <ActivityTable
          title="Recent Camps"
          rows={data.recentCamps.map((camp) => ({
            id: camp.id,
            primary: camp.title,
            secondary: camp.hospitalName,
            meta: formatDate(camp.startsAt),
          }))}
        />
      </div>
    </PageContainer>
  );
}

function ActivityTable({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ id: string; primary: string; secondary: string; meta: string }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            No recent records.
          </div>
        ) : (
          <div className="space-y-4">
            {rows.map((row) => (
              <div key={row.id} className="rounded-lg border p-4">
                <div className="font-medium">{row.primary}</div>
                <div className="mt-1 text-sm text-muted-foreground">{row.secondary}</div>
                <div className="mt-2 text-xs text-muted-foreground">{row.meta}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
