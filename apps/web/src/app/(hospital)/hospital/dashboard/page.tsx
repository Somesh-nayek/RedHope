'use client';

import { BellRing, CalendarDays, ClipboardList, Droplets, PackageOpen, Users } from 'lucide-react';
import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { PageContainer } from '@/components/page-container';
import { StatsCard } from '@/components/stats-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useHospitalDashboard } from '@/lib/hospital-api';
import { formatBloodGroup, formatDateTime } from '@/lib/formatters';

export default function HospitalDashboardPage() {
  const { data, isLoading, error } = useHospitalDashboard();

  return (
    <PageContainer
      title="Hospital Dashboard"
      description="Monitor inventory, requests, donor responses, and camp activity."
    >
      {isLoading ? <LoadingState label="Loading hospital dashboard..." /> : null}
      {error ? <ErrorState message={error.message} /> : null}
      {data ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <StatsCard
              title="Inventory Summary"
              value={`${data.inventorySummary.totalUnitsAvailable} units`}
              detail={`${data.inventorySummary.bloodGroupsTracked} blood groups tracked`}
              icon={PackageOpen}
            />
            <StatsCard
              title="Open Requests"
              value={String(data.activeRequests)}
              detail={`${data.totalRequests} total requests`}
              icon={ClipboardList}
            />
            <StatsCard
              title="Donations Received"
              value={String(data.totalDonationsReceived)}
              detail="Verified hospital donations"
              icon={Droplets}
            />
            <StatsCard
              title="Upcoming Camps"
              value={String(data.upcomingCamps)}
              detail="Active future camps"
              icon={CalendarDays}
            />
            <StatsCard
              title="Reserved Units"
              value={String(data.inventorySummary.totalUnitsReserved)}
              detail="Units currently reserved"
              icon={BellRing}
            />
            <StatsCard
              title="Recent Responses"
              value={String(data.recentResponses.length)}
              detail="Latest donor responses"
              icon={Users}
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Low Stock Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                {data.lowStockBloodGroups.length ? (
                  <div className="space-y-3">
                    {data.lowStockBloodGroups.map((item) => (
                      <div key={item.id} className="flex items-center justify-between rounded-lg border p-3">
                        <span className="font-semibold text-primary">{formatBloodGroup(item.bloodGroup)}</span>
                        <span className="text-sm text-muted-foreground">
                          {item.unitsAvailable} units, threshold {item.criticalThreshold}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No blood groups are below threshold.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Donor Responses</CardTitle>
              </CardHeader>
              <CardContent>
                {data.recentResponses.length ? (
                  <div className="space-y-3">
                    {data.recentResponses.map((response) => (
                      <div key={response.id} className="rounded-lg border p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium">{response.donorName}</p>
                          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold">
                            {response.responseStatus}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatBloodGroup(response.donorBloodGroup)} donor for{' '}
                          {formatBloodGroup(response.requestBloodGroup)} request
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDateTime(response.responseDate)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No donor responses yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </PageContainer>
  );
}
