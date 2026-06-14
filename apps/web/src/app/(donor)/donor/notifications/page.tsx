'use client';

import { Bell, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { PageContainer } from '@/components/page-container';
import { useDonorNotifications, useMarkNotificationRead } from '@/lib/donor-api';
import { formatDateTime } from '@/lib/formatters';

export default function DonorNotificationsPage() {
  const notifications = useDonorNotifications();
  const markRead = useMarkNotificationRead();

  return (
    <PageContainer
      title="Notifications"
      description="Updates about requests, camps, and your donor activity."
    >
      {notifications.isLoading ? <LoadingState label="Loading notifications..." /> : null}
      {notifications.error ? <ErrorState message={notifications.error.message} /> : null}
      {markRead.error ? <div className="mb-4"><ErrorState message={markRead.error.message} /></div> : null}
      {notifications.data?.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="Updates relevant to your donor account will appear here."
        />
      ) : null}
      {notifications.data?.length ? (
        <div className="space-y-3">
          {notifications.data.map((notification) => (
            <article
              key={notification.id}
              className={`rounded-xl border p-5 ${
                notification.isRead ? 'bg-card' : 'border-primary/30 bg-primary/5'
              }`}
            >
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold">{notification.title}</h2>
                    {!notification.isRead ? (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                        Unread
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{notification.message}</p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {formatDateTime(notification.createdAt)}
                  </p>
                </div>
                {!notification.isRead ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={markRead.isPending}
                    onClick={() => markRead.mutate(notification.id)}
                  >
                    <Check className="mr-2 size-4" />
                    Mark as read
                  </Button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </PageContainer>
  );
}
