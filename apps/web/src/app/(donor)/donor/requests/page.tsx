'use client';

import { ClipboardList } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { PageContainer } from '@/components/page-container';
import { useDonorDashboard, useDonorRequests, useRespondToRequest } from '@/lib/donor-api';
import { formatBloodGroup, formatDate } from '@/lib/formatters';

const urgencyStyles = {
  CRITICAL: 'bg-red-100 text-red-800',
  HIGH: 'bg-orange-100 text-orange-800',
  MODERATE: 'bg-amber-100 text-amber-800',
  LOW: 'bg-emerald-100 text-emerald-800'
};

export default function DonorRequestsPage() {
  const requests = useDonorRequests();
  const dashboard = useDonorDashboard();
  const response = useRespondToRequest();
  const [respondedIds, setRespondedIds] = useState<string[]>([]);

  async function handleRespond(requestId: string) {
    await response.mutateAsync(requestId);
    setRespondedIds((current) => [...current, requestId]);
  }

  return (
    <PageContainer
      title="Blood Requests"
      description="Open requests ordered by urgency and recency."
    >
      {requests.isLoading ? <LoadingState label="Loading blood requests..." /> : null}
      {requests.error ? <ErrorState message={requests.error.message} /> : null}
      {response.error ? <div className="mb-4"><ErrorState message={response.error.message} /></div> : null}
      {requests.data?.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No open blood requests"
          description="New requests will appear here when hospitals need donor support."
        />
      ) : null}
      {requests.data?.length ? (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hospital</TableHead>
                <TableHead>Blood Group</TableHead>
                <TableHead>Units</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.data.map((request) => {
                const responded = respondedIds.includes(request.requestId);
                const eligible = dashboard.data?.eligibility.eligible ?? false;
                return (
                  <TableRow key={request.requestId}>
                    <TableCell>
                      <p className="font-medium">{request.hospitalName}</p>
                      <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                        {request.description}
                      </p>
                    </TableCell>
                    <TableCell className="font-semibold text-primary">
                      {formatBloodGroup(request.bloodGroup)}
                    </TableCell>
                    <TableCell>{request.unitsRequired}</TableCell>
                    <TableCell>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${urgencyStyles[request.urgency]}`}>
                        {request.urgency}
                      </span>
                    </TableCell>
                    <TableCell>{request.city}, {request.state}</TableCell>
                    <TableCell>{formatDate(request.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant={responded ? 'secondary' : 'outline'}
                        disabled={!eligible || responded || response.isPending}
                        onClick={() => void handleRespond(request.requestId)}
                      >
                        {responded ? 'Responded' : 'Respond'}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {dashboard.data && !dashboard.data.eligibility.eligible ? (
            <p className="border-t bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
              Responding is disabled until you become eligible to donate.
            </p>
          ) : null}
        </div>
      ) : null}
    </PageContainer>
  );
}
