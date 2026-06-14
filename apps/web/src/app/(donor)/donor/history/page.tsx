'use client';

import { History } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { PageContainer } from '@/components/page-container';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { useDonationHistory } from '@/lib/donor-api';
import { formatBloodGroup, formatDate } from '@/lib/formatters';

export default function DonationHistoryPage() {
  const { data, isLoading, error } = useDonationHistory();

  return (
    <PageContainer
      title="Donation History"
      description="A record of your completed blood donations."
    >
      {isLoading ? <LoadingState label="Loading donation history..." /> : null}
      {error ? <ErrorState message={error.message} /> : null}
      {data?.length === 0 ? (
        <EmptyState
          icon={History}
          title="No donation history"
          description="Your recorded donations will appear here."
        />
      ) : null}
      {data?.length ? (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Hospital</TableHead>
                <TableHead>Blood Group</TableHead>
                <TableHead>Verified</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((donation) => (
                <TableRow key={donation.id}>
                  <TableCell>{formatDate(donation.donationDate)}</TableCell>
                  <TableCell className="font-medium">{donation.hospitalName}</TableCell>
                  <TableCell className="font-semibold text-primary">
                    {formatBloodGroup(donation.bloodGroup)}
                  </TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      donation.verified
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {donation.verified ? 'Verified' : 'Pending'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </PageContainer>
  );
}
