'use client';

import {
  Bell,
  CalendarDays,
  ClipboardList,
  Droplets,
  Hourglass,
  ShieldCheck
} from 'lucide-react';
import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { PageContainer } from '@/components/page-container';
import { StatsCard } from '@/components/stats-card';
import { useDonorDashboard } from '@/lib/donor-api';
import { formatDate } from '@/lib/formatters';

export default function DonorDashboardPage() {
  const { data, isLoading, error } = useDonorDashboard();

  return (
    <PageContainer
      title="Donor Dashboard"
      description="Your donation activity, eligibility, and opportunities to help."
    >
      {isLoading ? <LoadingState label="Loading donor dashboard..." /> : null}
      {error ? <ErrorState message={error.message} /> : null}
      {data ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <StatsCard
            title="Total Donations"
            value={String(data.totalDonations)}
            detail="Recorded donations"
            icon={Droplets}
          />
          <StatsCard
            title="Eligibility Status"
            value={data.eligibility.eligible ? 'Eligible' : 'Not eligible'}
            detail={
              data.nextEligibleDate
                ? `Next eligible ${formatDate(data.nextEligibleDate)}`
                : 'Ready to donate'
            }
            icon={ShieldCheck}
          />
          <StatsCard
            title="Days Until Eligible"
            value={String(data.daysRemaining)}
            detail={data.daysRemaining === 0 ? 'You can donate now' : 'Days remaining'}
            icon={Hourglass}
          />
          <StatsCard
            title="Active Blood Requests"
            value={String(data.activeRequestsCount)}
            detail="Open requests"
            icon={ClipboardList}
          />
          <StatsCard
            title="Upcoming Camps"
            value={String(data.upcomingCampsCount)}
            detail="Future active camps"
            icon={CalendarDays}
          />
          <StatsCard
            title="Unread Notifications"
            value={String(data.unreadNotificationsCount)}
            detail="Messages awaiting review"
            icon={Bell}
          />
        </div>
      ) : null}
    </PageContainer>
  );
}
