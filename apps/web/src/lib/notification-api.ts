'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiClient } from './api-client';
import { useAuth } from './auth-context';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  sentAt: string;
  createdAt: string;
  bloodRequestId?: string | null;
  campId?: string | null;
}

export interface NotificationList {
  items: NotificationItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function useClient() {
  const auth = useAuth();
  return new ApiClient({
    baseUrl: API_BASE_URL,
    getAccessToken: () => auth.accessToken,
    onRefreshTokenExpired: () => {
      void auth.logout();
    }
  });
}

export function useNotifications(page = 1, limit = 20) {
  const client = useClient();
  return useQuery({
    queryKey: ['notifications', page, limit],
    queryFn: () => client.get<NotificationList>(`/notifications?page=${page}&limit=${limit}`)
  });
}

export function useUnreadNotificationCount() {
  const client = useClient();
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => client.get<{ count: number }>('/notifications/unread-count'),
    refetchInterval: 30000
  });
}

export function useMarkNotificationRead() {
  const client = useClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => client.patch<{ message: string }>(`/notifications/${id}/read`),
    onSuccess: () => invalidateNotifications(queryClient)
  });
}

export function useMarkAllNotificationsRead() {
  const client = useClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => client.patch<{ message: string; count: number }>('/notifications/read-all'),
    onSuccess: () => invalidateNotifications(queryClient)
  });
}

export function useDeleteNotification() {
  const client = useClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => client.delete<{ message: string }>(`/notifications/${id}`),
    onSuccess: () => invalidateNotifications(queryClient)
  });
}

function invalidateNotifications(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ['notifications'] });
  void queryClient.invalidateQueries({ queryKey: ['donor', 'dashboard'] });
}
