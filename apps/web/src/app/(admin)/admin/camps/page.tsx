'use client';

import { CalendarDays } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
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
import { formatDateTime } from '@/lib/formatters';
import {
  useAdminCamps,
  useAdminHospitals,
  useCreateAdminCamp,
  useDeleteAdminCamp,
  useUpdateAdminCamp,
  type AdminCamp
} from '@/lib/admin-api';

type CampFormState = {
  hospitalId: string;
  title: string;
  venue: string;
  startsAt: string;
  endsAt: string;
  description: string;
};

const emptyForm: CampFormState = {
  hospitalId: '',
  title: '',
  venue: '',
  startsAt: '',
  endsAt: '',
  description: ''
};

export default function AdminCampsPage() {
  const camps = useAdminCamps();
  const hospitals = useAdminHospitals();
  const createCamp = useCreateAdminCamp();
  const updateCamp = useUpdateAdminCamp();
  const deleteCamp = useDeleteAdminCamp();
  const [editing, setEditing] = useState<AdminCamp | null>(null);
  const [form, setForm] = useState<CampFormState>(emptyForm);

  const hospitalOptions = useMemo(
    () => (hospitals.data ?? []).filter((hospital) => hospital.approved),
    [hospitals.data]
  );

  if (camps.isLoading || hospitals.isLoading) return <LoadingState label="Loading camps..." />;
  if (camps.isError) return <ErrorState message={camps.error.message} />;
  if (hospitals.isError) return <ErrorState message={hospitals.error.message} />;

  const resetForm = () => {
    setEditing(null);
    setForm(emptyForm);
  };

  const startEdit = (camp: AdminCamp) => {
    setEditing(camp);
    setForm({
      hospitalId: '',
      title: camp.title,
      venue: camp.venue,
      startsAt: toLocalInput(camp.startsAt),
      endsAt: toLocalInput(camp.endsAt),
      description: camp.description ?? ''
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (editing) {
      await updateCamp.mutateAsync({
        id: editing.id,
        payload: {
          title: form.title,
          venue: form.venue,
          startsAt: new Date(form.startsAt).toISOString(),
          endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : undefined,
          description: form.description || undefined
        }
      });
      resetForm();
      return;
    }

    await createCamp.mutateAsync({
      hospitalId: form.hospitalId,
      title: form.title,
      venue: form.venue,
      startsAt: new Date(form.startsAt).toISOString(),
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : undefined,
      description: form.description || undefined
    });
    resetForm();
  };

  const data = camps.data ?? [];

  return (
    <PageContainer title="Donation Camps" description="Create and manage donation camps across hospitals.">
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{editing ? 'Edit Camp' : 'Create Camp'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
              {!editing && (
                <label className="block text-sm font-medium">
                  Hospital
                  <select
                    className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm"
                    required
                    value={form.hospitalId}
                    onChange={(event) => setForm((current) => ({ ...current, hospitalId: event.target.value }))}
                  >
                    <option value="">Select hospital</option>
                    {hospitalOptions.map((hospital) => (
                      <option key={hospital.id} value={hospital.id}>
                        {hospital.hospitalName}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className="block text-sm font-medium">
                Title
                <Input required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="mt-2" />
              </label>
              <label className="block text-sm font-medium">
                Venue
                <Input required value={form.venue} onChange={(event) => setForm((current) => ({ ...current, venue: event.target.value }))} className="mt-2" />
              </label>
              <label className="block text-sm font-medium">
                Starts At
                <Input required type="datetime-local" value={form.startsAt} onChange={(event) => setForm((current) => ({ ...current, startsAt: event.target.value }))} className="mt-2" />
              </label>
              <label className="block text-sm font-medium">
                Ends At
                <Input type="datetime-local" value={form.endsAt} onChange={(event) => setForm((current) => ({ ...current, endsAt: event.target.value }))} className="mt-2" />
              </label>
              <label className="block text-sm font-medium">
                Description
                <textarea
                  className="mt-2 min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                />
              </label>
              <div className="flex gap-2">
                <Button type="submit" variant="outline" disabled={createCamp.isPending || updateCamp.isPending || (!editing && hospitalOptions.length === 0)}>
                  {editing ? 'Update Camp' : 'Create Camp'}
                </Button>
                {editing && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                )}
              </div>
              {!editing && hospitalOptions.length === 0 && (
                <p className="text-xs text-muted-foreground">Approve a hospital before creating a camp.</p>
              )}
            </form>
          </CardContent>
        </Card>

        {data.length === 0 ? (
          <EmptyState icon={CalendarDays} title="No camps found" description="Admin-created and hospital-created camps will appear here." />
        ) : (
          <div className="overflow-hidden rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Hospital</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((camp) => (
                  <TableRow key={camp.id}>
                    <TableCell>
                      <div className="font-medium">{camp.title}</div>
                      <div className="text-xs text-muted-foreground">{camp.description ?? 'No description'}</div>
                    </TableCell>
                    <TableCell>{camp.hospitalName}</TableCell>
                    <TableCell>{camp.venue}</TableCell>
                    <TableCell>{formatDateTime(camp.startsAt)}</TableCell>
                    <TableCell>{camp.isActive ? 'Active' : 'Inactive'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => startEdit(camp)}>
                          Edit
                        </Button>
                        {camp.isActive ? (
                          <Button size="sm" variant="outline" onClick={() => deleteCamp.mutate(camp.id)} disabled={deleteCamp.isPending}>
                            Delete
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => updateCamp.mutate({ id: camp.id, payload: { isActive: true } })} disabled={updateCamp.isPending}>
                            Restore
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

function toLocalInput(value: string) {
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}
