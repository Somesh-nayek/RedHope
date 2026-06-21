'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
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
import {
  useHospitalRequestResponses,
  useUpdateHospitalResponse
} from '@/lib/hospital-api';
import { formatBloodGroup, formatDateTime } from '@/lib/formatters';

export default function HospitalResponsesPage() {
  const params = useParams<{ id: string }>();
  const requestId = params?.id ?? '';
  const responses = useHospitalRequestResponses(requestId);
  const updateResponse = useUpdateHospitalResponse(requestId);

  return (
    <PageContainer
      title="Donor Responses"
      description="Review donor responses and verify completed donations."
    >
      <div className="mb-4">
        <Button asChild variant="outline">
          <Link href="/hospital/requests">Back to requests</Link>
        </Button>
      </div>
      {responses.isLoading ? <LoadingState label="Loading donor responses..." /> : null}
      {responses.error ? <ErrorState message={responses.error.message} /> : null}
      {updateResponse.error ? <ErrorState message={updateResponse.error.message} /> : null}
      {responses.data?.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No donor responses"
          description="Donor responses for this request will appear here."
        />
      ) : null}
      {responses.data?.length ? (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Donor</TableHead>
                <TableHead>Donor Blood Group</TableHead>
                <TableHead>Request Blood Group</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Response Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {responses.data.map((response) => (
                <TableRow key={response.id}>
                  <TableCell className="font-medium">{response.donorName}</TableCell>
                  <TableCell>{formatBloodGroup(response.donorBloodGroup)}</TableCell>
                  <TableCell className="font-semibold text-primary">
                    {formatBloodGroup(response.requestBloodGroup)}
                  </TableCell>
                  <TableCell>{response.responseStatus}</TableCell>
                  <TableCell>{formatDateTime(response.responseDate)}</TableCell>
                  <TableCell className="space-x-2 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={
                        updateResponse.isPending || response.responseStatus === 'VERIFIED'
                      }
                      onClick={() =>
                        updateResponse.mutate({ id: response.id, status: 'VERIFIED' })
                      }
                    >
                      Verify Donation
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={
                        updateResponse.isPending || response.responseStatus === 'REJECTED'
                      }
                      onClick={() =>
                        updateResponse.mutate({ id: response.id, status: 'REJECTED' })
                      }
                    >
                      Reject
                    </Button>
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
