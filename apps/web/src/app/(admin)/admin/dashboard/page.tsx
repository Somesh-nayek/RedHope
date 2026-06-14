'use client';

import { Building2, CalendarDays, Users } from 'lucide-react';
import { PageContainer } from '@/components/page-container';
import { StatsCard } from '@/components/stats-card';

export default function AdminDashboardPage() {
  return (
    <PageContainer
      title="Admin Dashboard"
      description="Platform-wide activity and account overview."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatsCard title="Total Users" value="0" detail="Placeholder data" icon={Users} />
        <StatsCard
          title="Total Hospitals"
          value="0"
          detail="Placeholder data"
          icon={Building2}
        />
        <StatsCard
          title="Total Camps"
          value="0"
          detail="Placeholder data"
          icon={CalendarDays}
        />
      </div>
    </PageContainer>
  );
}
