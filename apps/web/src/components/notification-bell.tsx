'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount
} from '@/lib/notification-api';
import { formatDateTime } from '@/lib/formatters';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const notifications = useNotifications(1, 5);
  const unread = useUnreadNotificationCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotification = useDeleteNotification();
  const unreadCount = unread.data?.count ?? 0;

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Notifications"
        className="relative"
        onClick={() => setOpen((current) => !current)}
      >
        <Bell className="size-5" />
        {unreadCount > 0 ? (
          <span className="absolute right-1 top-1 min-w-5 rounded-full bg-primary px-1 text-[10px] font-semibold leading-5 text-primary-foreground">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </Button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-lg border bg-background shadow-lg">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Notifications</p>
              <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={markAllRead.isPending || unreadCount === 0}
              onClick={() => markAllRead.mutate()}
            >
              <CheckCheck className="mr-2 size-4" />
              Read all
            </Button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.isLoading ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">Loading notifications...</p>
            ) : null}
            {notifications.data?.items.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">No notifications yet.</p>
            ) : null}
            {notifications.data?.items.map((notification) => (
              <div
                key={notification.id}
                className={`border-b px-4 py-3 last:border-b-0 ${
                  notification.isRead ? '' : 'bg-primary/5'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{notification.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {notification.message}
                    </p>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      {formatDateTime(notification.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {!notification.isRead ? (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label="Mark notification as read"
                        disabled={markRead.isPending}
                        onClick={() => markRead.mutate(notification.id)}
                      >
                        <CheckCheck className="size-4" />
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label="Delete notification"
                      disabled={deleteNotification.isPending}
                      onClick={() => deleteNotification.mutate(notification.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/notifications"
            className="block border-t px-4 py-3 text-center text-sm font-medium text-primary hover:bg-muted"
            onClick={() => setOpen(false)}
          >
            View all notifications
          </Link>
        </div>
      ) : null}
    </div>
  );
}
