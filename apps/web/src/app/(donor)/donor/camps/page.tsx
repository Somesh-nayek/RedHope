'use client';

import { CalendarDays, MapPin } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { PageContainer } from '@/components/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDonorCamps } from '@/lib/donor-api';
import { formatDateTime } from '@/lib/formatters';

export default function DonorCampsPage() {
  const { data, isLoading, error } = useDonorCamps();

  return (
    <PageContainer
      title="Donation Camps"
      description="Find upcoming blood donation camps near the community."
    >
      {isLoading ? <LoadingState label="Loading donation camps..." /> : null}
      {error ? <ErrorState message={error.message} /> : null}
      {data?.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No upcoming camps"
          description="Future active donation camps will appear here."
        />
      ) : null}
      {data?.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {data.map((camp) => (
            <Card key={camp.id}>
              <CardHeader>
                <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CalendarDays className="size-5" />
                </div>
                <CardTitle className="text-lg">{camp.title}</CardTitle>
                <p className="text-sm font-medium text-primary">{formatDateTime(camp.date)}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {camp.description || 'Community blood donation camp.'}
                </p>
                <p className="flex gap-2 text-sm">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  {camp.venue}
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Organizer:</span>{' '}
                  <span className="font-medium">{camp.hospitalName}</span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </PageContainer>
  );
}
