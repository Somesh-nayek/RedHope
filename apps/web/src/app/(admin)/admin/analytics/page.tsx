'use client';

import { BarChart3 } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { PageContainer } from '@/components/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatBloodGroup } from '@/lib/formatters';
import { useAdminAnalytics } from '@/lib/admin-api';

const COLORS = ['#dc2626', '#ea580c', '#d97706', '#16a34a', '#0891b2', '#2563eb', '#7c3aed', '#be185d'];

export default function AdminAnalyticsPage() {
  const analytics = useAdminAnalytics();

  if (analytics.isLoading) return <LoadingState label="Loading analytics..." />;
  if (analytics.isError) return <ErrorState message={analytics.error.message} />;

  const data = analytics.data;
  if (!data) {
    return (
      <PageContainer title="Analytics" description="System-wide trends and operational distribution.">
        <EmptyState icon={BarChart3} title="No analytics data" description="Charts will appear as platform activity grows." />
      </PageContainer>
    );
  }

  const bloodDistribution = data.bloodDistribution.map((item) => ({
    ...item,
    label: formatBloodGroup(item.bloodGroup)
  }));
  const inventory = data.inventoryByBloodGroup.map((item) => ({
    ...item,
    label: formatBloodGroup(item.bloodGroup)
  }));

  return (
    <PageContainer title="Analytics" description="System-wide trends and operational distribution.">
      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="User Growth">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.userGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#dc2626" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Hospital Growth">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.hospitalGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Monthly Donations">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.donationsPerMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#dc2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Blood Distribution">
          {bloodDistribution.length === 0 ? (
            <EmptyChart label="No donations recorded yet." />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={bloodDistribution} dataKey="count" nameKey="label" outerRadius={90} label>
                  {bloodDistribution.map((entry, index) => (
                    <Cell key={entry.bloodGroup} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Request Status">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.requestStatusDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#ea580c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Inventory By Blood Group">
          {inventory.length === 0 ? (
            <EmptyChart label="No inventory reported yet." />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={inventory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="unitsAvailable" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <ActivityList
          title="Hospital Activity"
          rows={data.hospitalActivity.map((hospital) => ({
            id: hospital.id,
            primary: hospital.hospitalName,
            secondary: hospital.requests + ' requests • ' + hospital.donations + ' donations • ' + hospital.camps + ' camps'
          }))}
        />
        <ActivityList
          title="Donor Activity"
          rows={data.donorActivity.map((donor) => ({
            id: donor.id,
            primary: donor.donorName,
            secondary: donor.donations + ' donations • ' + donor.responses + ' responses'
          }))}
        />
      </div>
    </PageContainer>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function EmptyChart({ label }: { label: string }) {
  return <div className="flex h-[260px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">{label}</div>;
}

function ActivityList({
  title,
  rows
}: {
  title: string;
  rows: Array<{ id: string; primary: string; secondary: string }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">No activity yet.</div>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <div key={row.id} className="rounded-lg border p-4">
                <div className="font-medium">{row.primary}</div>
                <div className="mt-1 text-sm text-muted-foreground">{row.secondary}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
