'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { Header } from '@/components/header';
import { LoadingState } from '@/components/loading-state';
import { PageContainer } from '@/components/page-container';
import { useAuth } from '@/lib/auth-context';
import { formatDateTime } from '@/lib/formatters';
import {
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications
} from '@/lib/notification-api';

export default function NotificationsPage() {
  const router = useRouter();
  const auth = useAuth();
  const notifications = useNotifications(1, 50);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotification = useDeleteNotification();
  const unreadCount = notifications.data?.items.filter((notification) => !notification.isRead).length ?? 0;

  useEffect(() => {
    if (!auth.isLoading && !auth.user) router.replace('/login');
  }, [auth.isLoading, auth.user, router]);

  if (auth.isLoading || !auth.user) {
    return <LoadingState fullPage label="Checking access..." />;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Header section="Notifications" />
      <PageContainer
        title="Notifications"
        description="System updates about requests, camps, approvals, and account activity."
      >
        <div className="mb-4 flex justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={markAllRead.isPending || unreadCount === 0}
            onClick={() => markAllRead.mutate()}
          >
            <CheckCheck className="mr-2 size-4" />
            Mark all as read
          </Button>
        </div>

        {notifications.isLoading ? <LoadingState label="Loading notifications..." /> : null}
        {notifications.error ? <ErrorState message={notifications.error.message} /> : null}
        {markRead.error ? <div className="mb-4"><ErrorState message={markRead.error.message} /></div> : null}
        {markAllRead.error ? <div className="mb-4"><ErrorState message={markAllRead.error.message} /></div> : null}
        {deleteNotification.error ? (
          <div className="mb-4"><ErrorState message={deleteNotification.error.message} /></div>
        ) : null}

        {notifications.data?.items.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notifications"
            description="Updates relevant to your account will appear here."
          />
        ) : null}

        {notifications.data?.items.length ? (
          <div className="space-y-3">
            {notifications.data.items.map((notification) => (
              <article
                key={notification.id}
                className={`rounded-xl border p-5 ${
                  notification.isRead ? 'bg-card' : 'border-primary/30 bg-primary/5'
                }`}
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
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
                  <div className="flex shrink-0 gap-2">
                    {!notification.isRead ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={markRead.isPending}
                        onClick={() => markRead.mutate(notification.id)}
                      >
                        <Check className="mr-2 size-4" />
                        Read
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={deleteNotification.isPending}
                      onClick={() => deleteNotification.mutate(notification.id)}
                    >
                      <Trash2 className="mr-2 size-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </PageContainer>
    </div>
  );
}
