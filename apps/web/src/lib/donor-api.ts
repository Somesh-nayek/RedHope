'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useAuth } from './auth-context';
import { ApiClient } from './api-client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export interface Eligibility {
  eligible: boolean;
  nextEligibleDate: string | null;
  daysRemaining: number;
}

export interface DonorDashboard {
  totalDonations: number;
  eligibility: Eligibility;
  nextEligibleDate: string | null;
  daysRemaining: number;
  activeRequestsCount: number;
  upcomingCampsCount: number;
  unreadNotificationsCount: number;
}

export interface DonorRequest {
  requestId: string;
  hospitalName: string;
  bloodGroup: string;
  unitsRequired: number;
  urgency: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  description: string;
  city: string;
  state: string;
  createdAt: string;
}

export interface DonorCamp {
  id: string;
  title: string;
  description: string | null;
  venue: string;
  date: string;
  hospitalName: string;
}

export interface DonationHistory {
  id: string;
  donationDate: string;
  hospitalName: string;
  bloodGroup: string;
  verified: boolean;
}

export interface DonorNotification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

function useDonorClient() {
  const { accessToken } = useAuth();
  const client = useMemo(
    () =>
      new ApiClient({
        baseUrl: API_BASE_URL,
        getAccessToken: () => accessToken
      }),
    [accessToken]
  );
  return { client, enabled: Boolean(accessToken) };
}

export function useDonorDashboard() {
  const { client, enabled } = useDonorClient();
  return useQuery({
    queryKey: ['donor', 'dashboard'],
    queryFn: () => client.get<DonorDashboard>('/donor/dashboard'),
    enabled
  });
}

export function useDonorRequests() {
  const { client, enabled } = useDonorClient();
  return useQuery({
    queryKey: ['donor', 'requests'],
    queryFn: () => client.get<DonorRequest[]>('/donor/requests'),
    enabled
  });
}

export function useRespondToRequest() {
  const { client } = useDonorClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) =>
      client.post<{ message: string }>(`/donor/respond/${requestId}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['donor', 'dashboard'] });
    }
  });
}

export function useDonorCamps() {
  const { client, enabled } = useDonorClient();
  return useQuery({
    queryKey: ['donor', 'camps'],
    queryFn: () => client.get<DonorCamp[]>('/donor/camps'),
    enabled
  });
}

export function useDonationHistory() {
  const { client, enabled } = useDonorClient();
  return useQuery({
    queryKey: ['donor', 'history'],
    queryFn: () => client.get<DonationHistory[]>('/donor/history'),
    enabled
  });
}

export function useDonorNotifications() {
  const { client, enabled } = useDonorClient();
  return useQuery({
    queryKey: ['donor', 'notifications'],
    queryFn: () => client.get<DonorNotification[]>('/donor/notifications'),
    enabled
  });
}

export function useMarkNotificationRead() {
  const { client } = useDonorClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) =>
      client.patch<{ message: string }>(`/donor/notifications/${notificationId}/read`),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['donor', 'notifications'] }),
        queryClient.invalidateQueries({ queryKey: ['donor', 'dashboard'] })
      ]);
    }
  });
}
