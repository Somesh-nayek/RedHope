'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { BarChart3, ClipboardList, Droplets } from 'lucide-react';
import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { PageContainer } from '@/components/page-container';
import { StatsCard } from '@/components/stats-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useHospitalAnalytics } from '@/lib/hospital-api';
import { formatBloodGroup } from '@/lib/formatters';

const chartColors = ['#c81e35', '#e85d75', '#f59e0b', '#10b981', '#6366f1', '#14b8a6'];

export default function HospitalAnalyticsPage() {
  const { data, isLoading, error } = useHospitalAnalytics();

  const inventoryLevels =
    data?.inventoryLevels.map((item) => ({
      bloodGroup: formatBloodGroup(item.bloodGroup),
      unitsAvailable: item.unitsAvailable,
      criticalThreshold: item.criticalThreshold
    })) ?? [];

  const bloodGroupDistribution =
    data?.bloodGroupDistribution.map((item) => ({
      bloodGroup: formatBloodGroup(item.bloodGroup),
      count: item.count
    })) ?? [];

  return (
    <PageContainer
      title="Hospital Analytics"
      description="Track donations, request status, and blood group distribution."
    >
      {isLoading ? <LoadingState label="Loading analytics..." /> : null}
      {error ? <ErrorState message={error.message} /> : null}
      {data ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <StatsCard
              title="Donations This Month"
              value={String(data.donationsThisMonth)}
              detail="Verified donations"
              icon={Droplets}
            />
            <StatsCard
              title="Fulfilled Requests"
              value={String(data.fulfilledRequests)}
              detail="Completed hospital requests"
              icon={ClipboardList}
            />
            <StatsCard
              title="Pending Requests"
              value={String(data.pendingRequests)}
              detail="Open requests"
              icon={BarChart3}
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Blood Inventory Chart</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={inventoryLevels}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="bloodGroup" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="unitsAvailable" fill="#c81e35" name="Units" />
                    <Bar dataKey="criticalThreshold" fill="#f59e0b" name="Threshold" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Blood Group Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={bloodGroupDistribution}
                      dataKey="count"
                      nameKey="bloodGroup"
                      outerRadius={100}
                      label
                    >
                      {bloodGroupDistribution.map((entry, index) => (
                        <Cell
                          key={entry.bloodGroup}
                          fill={chartColors[index % chartColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Request Status Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.requestStatusDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#c81e35" name="Requests" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Donations</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[{ month: 'Current Month', donations: data.donationsThisMonth }]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="donations" fill="#10b981" name="Donations" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </PageContainer>
  );
}
