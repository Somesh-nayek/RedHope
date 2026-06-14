'use client';

import { BadgeCheck, ClipboardList, PackageOpen } from 'lucide-react';
import { PageContainer } from '@/components/page-container';
import { StatsCard } from '@/components/stats-card';

export default function HospitalDashboardPage() {
  return (
    <PageContainer
      title="Hospital Dashboard"
      description="Monitor hospital blood operations from one place."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatsCard
          title="Inventory Summary"
          value="0 units"
          detail="Placeholder data"
          icon={PackageOpen}
        />
        <StatsCard
          title="Active Requests"
          value="0"
          detail="Placeholder data"
          icon={ClipboardList}
        />
        <StatsCard
          title="Approval Status"
          value="Approved"
          detail="Hospital dashboard access granted"
          icon={BadgeCheck}
        />
      </div>
    </PageContainer>
  );
}
