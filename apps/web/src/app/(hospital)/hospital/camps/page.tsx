'use client';

import { FormEvent, useState } from 'react';
import { CalendarDays, Plus } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { PageContainer } from '@/components/page-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  HospitalCamp,
  useCreateHospitalCamp,
  useDeleteHospitalCamp,
  useHospitalCamps,
  useUpdateHospitalCamp
} from '@/lib/hospital-api';
import { formatDateTime } from '@/lib/formatters';

export default function HospitalCampsPage() {
  const camps = useHospitalCamps();
  const createCamp = useCreateHospitalCamp();
  const updateCamp = useUpdateHospitalCamp();
  const deleteCamp = useDeleteHospitalCamp();
  const [editing, setEditing] = useState<HospitalCamp | null>(null);
  const [form, setForm] = useState({
    title: '',
    venue: '',
    startsAt: '',
    endsAt: '',
    description: ''
  });

  function resetForm() {
    setEditing(null);
    setForm({ title: '', venue: '', startsAt: '', endsAt: '', description: '' });
  }

  function startEdit(camp: HospitalCamp) {
    setEditing(camp);
    setForm({
      title: camp.title,
      venue: camp.venue,
      startsAt: camp.startsAt.slice(0, 16),
      endsAt: camp.endsAt.slice(0, 16),
      description: camp.description ?? ''
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const payload = {
      title: form.title,
      venue: form.venue,
      startsAt: new Date(form.startsAt).toISOString(),
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : undefined,
      description: form.description || undefined
    };

    if (editing) {
      await updateCamp.mutateAsync({ id: editing.id, payload });
    } else {
      await createCamp.mutateAsync(payload);
    }
    resetForm();
  }

  const mutationError = createCamp.error || updateCamp.error || deleteCamp.error || null;

  return (
    <PageContainer
      title="Donation Camps"
      description="Create and manage hospital blood donation camps."
    >
      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{editing ? 'Edit Camp' : 'Create Camp'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
              <div>
                <label className="text-sm font-medium" htmlFor="title">
                  Title
                </label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, title: event.target.value }))
                  }
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="venue">
                  Venue
                </label>
                <Input
                  id="venue"
                  value={form.venue}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, venue: event.target.value }))
                  }
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="startsAt">
                  Date
                </label>
                <Input
                  id="startsAt"
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, startsAt: event.target.value }))
                  }
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="endsAt">
                  End Time
                </label>
                <Input
                  id="endsAt"
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, endsAt: event.target.value }))
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="campDescription">
                  Description
                </label>
                <textarea
                  id="campDescription"
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, description: event.target.value }))
                  }
                  className="mt-1 min-h-24 w-full rounded-md border bg-white px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="outline" disabled={createCamp.isPending || updateCamp.isPending}>
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
          {camps.isLoading ? <LoadingState label="Loading camps..." /> : null}
          {camps.error ? <ErrorState message={camps.error.message} /> : null}
          {mutationError ? <ErrorState message={mutationError.message} /> : null}
          {camps.data?.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No donation camps"
              description="Schedule donation camps to help donors find opportunities."
            />
          ) : null}
          {camps.data?.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {camps.data.map((camp) => (
                <Card key={camp.id} className={camp.isActive ? '' : 'opacity-60'}>
                  <CardHeader>
                    <CardTitle className="text-lg">{camp.title}</CardTitle>
                    <p className="text-sm text-primary">{formatDateTime(camp.startsAt)}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {camp.description || 'No description provided.'}
                    </p>
                    <p className="text-sm">
                      <span className="text-muted-foreground">Venue:</span> {camp.venue}
                    </p>
                    <p className="text-sm">
                      <span className="text-muted-foreground">Status:</span>{' '}
                      {camp.isActive ? 'Active' : 'Inactive'}
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => startEdit(camp)}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={deleteCamp.isPending || !camp.isActive}
                        onClick={() => deleteCamp.mutate(camp.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </PageContainer>
  );
}
