'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { ClipboardList, Plus } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { PageContainer } from '@/components/page-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  BloodGroup,
  HospitalRequest,
  RequestUrgency,
  useCreateHospitalRequest,
  useDeleteHospitalRequest,
  useHospitalRequests,
  useUpdateHospitalRequest
} from '@/lib/hospital-api';
import { formatBloodGroup, formatDate } from '@/lib/formatters';

const bloodGroups: BloodGroup[] = [
  'A_POSITIVE',
  'A_NEGATIVE',
  'B_POSITIVE',
  'B_NEGATIVE',
  'AB_POSITIVE',
  'AB_NEGATIVE',
  'O_POSITIVE',
  'O_NEGATIVE'
];
const urgencies: RequestUrgency[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export default function HospitalRequestsPage() {
  const requests = useHospitalRequests();
  const createRequest = useCreateHospitalRequest();
  const updateRequest = useUpdateHospitalRequest();
  const deleteRequest = useDeleteHospitalRequest();
  const [editing, setEditing] = useState<HospitalRequest | null>(null);
  const [form, setForm] = useState({
    bloodGroup: 'O_POSITIVE' as BloodGroup,
    unitsRequired: '1',
    urgency: 'HIGH' as RequestUrgency,
    description: ''
  });

  function resetForm() {
    setEditing(null);
    setForm({ bloodGroup: 'O_POSITIVE', unitsRequired: '1', urgency: 'HIGH', description: '' });
  }

  function startEdit(request: HospitalRequest) {
    setEditing(request);
    setForm({
      bloodGroup: request.bloodGroup,
      unitsRequired: String(request.unitsRequired),
      urgency: request.urgency,
      description: request.description
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const payload = {
      bloodGroup: form.bloodGroup,
      unitsRequired: Number(form.unitsRequired),
      urgency: form.urgency,
      description: form.description
    };

    if (editing) {
      await updateRequest.mutateAsync({ id: editing.id, payload });
    } else {
      await createRequest.mutateAsync(payload);
    }
    resetForm();
  }

  const mutationError =
    createRequest.error || updateRequest.error || deleteRequest.error || null;

  return (
    <PageContainer
      title="Blood Requests"
      description="Create, update, fulfil, and cancel hospital blood requests."
    >
      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{editing ? 'Edit Request' : 'Create Request'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
              <div>
                <label className="text-sm font-medium" htmlFor="requestBloodGroup">
                  Blood Group
                </label>
                <select
                  id="requestBloodGroup"
                  value={form.bloodGroup}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      bloodGroup: event.target.value as BloodGroup
                    }))
                  }
                  className="mt-1 h-10 w-full rounded-md border bg-white px-3 text-sm"
                >
                  {bloodGroups.map((bloodGroup) => (
                    <option key={bloodGroup} value={bloodGroup}>
                      {formatBloodGroup(bloodGroup)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="unitsRequired">
                  Units Required
                </label>
                <Input
                  id="unitsRequired"
                  type="number"
                  min={1}
                  value={form.unitsRequired}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, unitsRequired: event.target.value }))
                  }
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="urgency">
                  Urgency
                </label>
                <select
                  id="urgency"
                  value={form.urgency}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      urgency: event.target.value as RequestUrgency
                    }))
                  }
                  className="mt-1 h-10 w-full rounded-md border bg-white px-3 text-sm"
                >
                  {urgencies.map((urgency) => (
                    <option key={urgency} value={urgency}>
                      {urgency === 'MEDIUM' ? 'MODERATE' : urgency}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, description: event.target.value }))
                  }
                  required
                  className="mt-1 min-h-24 w-full rounded-md border bg-white px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="outline" disabled={createRequest.isPending || updateRequest.isPending}>
                  <Plus className="mr-2 size-4" />
                  {editing ? 'Save' : 'Create'}
                </Button>
                {editing ? (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {requests.isLoading ? <LoadingState label="Loading requests..." /> : null}
          {requests.error ? <ErrorState message={requests.error.message} /> : null}
          {mutationError ? <ErrorState message={mutationError.message} /> : null}
          {requests.data?.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No blood requests"
              description="Create emergency or routine blood requests for donor visibility."
            />
          ) : null}
          {requests.data?.length ? (
            <div className="overflow-hidden rounded-xl border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Blood Group</TableHead>
                    <TableHead>Units</TableHead>
                    <TableHead>Urgency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Responses</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.data.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-semibold text-primary">
                        {formatBloodGroup(request.bloodGroup)}
                      </TableCell>
                      <TableCell>{request.unitsRequired}</TableCell>
                      <TableCell>{request.urgency === 'MEDIUM' ? 'MODERATE' : request.urgency}</TableCell>
                      <TableCell>{request.status}</TableCell>
                      <TableCell>{request.responsesCount}</TableCell>
                      <TableCell>{formatDate(request.createdAt)}</TableCell>
                      <TableCell className="space-x-2 text-right">
                        <Button variant="outline" size="sm" onClick={() => startEdit(request)}>
                          Edit
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={updateRequest.isPending || request.status === 'FULFILLED'}
                          onClick={() =>
                            updateRequest.mutate({
                              id: request.id,
                              payload: { status: 'FULFILLED' }
                            })
                          }
                        >
                          Fulfill
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={deleteRequest.isPending || request.status === 'CANCELLED'}
                          onClick={() => deleteRequest.mutate(request.id)}
                        >
                          Cancel
                        </Button>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/hospital/requests/${request.id}/responses`}>
                            Responses
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </div>
      </div>
    </PageContainer>
  );
}
