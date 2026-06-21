'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { ApiClient } from './api-client';
import { useAuth } from './auth-context';
import type { BloodGroup, RequestUrgency } from './hospital-api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export type UserRole = 'ADMIN' | 'HOSPITAL' | 'DONOR' | 'VOLUNTEER';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';
export type RequestStatus =
  | 'OPEN'
  | 'ACCEPTED'
  | 'PARTIALLY_FULFILLED'
  | 'FULFILLED'
  | 'CANCELLED'
  | 'EXPIRED';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  hospital: { id: string; name: string; approved: boolean } | null;
  donor: { id: string; bloodGroup: BloodGroup; city: string; state: string } | null;
}

export interface AdminHospital {
  id: string;
  userId: string;
  hospitalName: string;
  licenseNumber: string;
  contactNumber: string;
  address: string;
  city: string;
  state: string;
  postalCode: string | null;
  approved: boolean;
  approvalStatus: 'APPROVED' | 'PENDING';
  email: string | null;
  userStatus: UserStatus | null;
  createdAt: string;
  counts: {
    inventories: number;
    requests: number;
    camps: number;
    donations: number;
  };
}

export interface AdminCamp {
  id: string;
  title: string;
  venue: string;
  city: string;
  state: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  hospitalName: string;
  hospitalCity: string;
  hospitalState: string;
}

export interface AdminDashboard {
  totalUsers: number;
  totalDonors: number;
  totalHospitals: number;
  approvedHospitals: number;
  pendingHospitals: number;
  totalDonationCamps: number;
  activeBloodRequests: number;
  totalDonations: number;
  bloodInventorySummary: Array<{ bloodGroup: BloodGroup; unitsAvailable: number; unitsReserved: number }>;
  pendingHospitalApprovals: AdminHospital[];
  recentBloodRequests: Array<{
    id: string;
    hospitalName: string;
    bloodGroup: BloodGroup;
    unitsRequired: number;
    urgency: RequestUrgency;
    status: RequestStatus;
    city: string;
    state: string;
    createdAt: string;
  }>;
  recentDonations: Array<{
    id: string;
    donorName: string;
    hospitalName: string;
    bloodGroup: BloodGroup;
    unitsDonated: number;
    donatedAt: string;
  }>;
  recentCamps: AdminCamp[];
}

export interface AdminAnalytics {
  usersByRole: Array<{ role: UserRole; count: number }>;
  donationsPerMonth: Array<{ month: string; count: number }>;
  requestsByUrgency: Array<{ urgency: RequestUrgency; count: number }>;
  requestStatusDistribution: Array<{ status: RequestStatus; count: number }>;
  inventoryByBloodGroup: Array<{ bloodGroup: BloodGroup; unitsAvailable: number }>;
  hospitalActivity: Array<{ id: string; hospitalName: string; requests: number; donations: number; camps: number }>;
  donorActivity: Array<{ id: string; donorName: string; donations: number; responses: number }>;
  userGrowth: Array<{ month: string; count: number }>;
  hospitalGrowth: Array<{ month: string; count: number }>;
  bloodDistribution: Array<{ bloodGroup: BloodGroup; count: number }>;
}

export type AdminCampPayload = {
  hospitalId: string;
  title: string;
  venue: string;
  startsAt: string;
  endsAt?: string;
  description?: string;
};

function useAdminClient() {
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

export function useAdminDashboard() {
  const { client, enabled } = useAdminClient();
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => client.get<AdminDashboard>('/admin/dashboard'),
    enabled
  });
}

export function useAdminUsers() {
  const { client, enabled } = useAdminClient();
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => client.get<AdminUser[]>('/admin/users'),
    enabled
  });
}

export function useUpdateAdminUserStatus() {
  const { client } = useAdminClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: UserStatus }) =>
      client.patch<AdminUser>('/admin/users/' + id, { status }),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'users'] });
      const previous = queryClient.getQueryData<AdminUser[]>(['admin', 'users']);
      queryClient.setQueryData<AdminUser[]>(['admin', 'users'], (current) =>
        current?.map((user) => (user.id === id ? { ...user, status } : user))
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(['admin', 'users'], context.previous);
    },
    onSettled: async () => {
      await invalidateAdmin(queryClient);
    }
  });
}

export function useAdminHospitals() {
  const { client, enabled } = useAdminClient();
  return useQuery({
    queryKey: ['admin', 'hospitals'],
    queryFn: () => client.get<AdminHospital[]>('/admin/hospitals'),
    enabled
  });
}

export function useApproveHospital() {
  const { client } = useAdminClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => client.patch<AdminHospital>('/admin/hospitals/' + id + '/approve'),
    onSuccess: async () => {
      await invalidateAdmin(queryClient);
    }
  });
}

export function useRejectHospital() {
  const { client } = useAdminClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => client.patch<AdminHospital>('/admin/hospitals/' + id + '/reject'),
    onSuccess: async () => {
      await invalidateAdmin(queryClient);
    }
  });
}

export function useAdminCamps() {
  const { client, enabled } = useAdminClient();
  return useQuery({
    queryKey: ['admin', 'camps'],
    queryFn: () => client.get<AdminCamp[]>('/admin/camps'),
    enabled
  });
}

export function useCreateAdminCamp() {
  const { client } = useAdminClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AdminCampPayload) => client.post<AdminCamp>('/admin/camps', payload),
    onSuccess: async () => {
      await invalidateAdmin(queryClient);
    }
  });
}

export function useUpdateAdminCamp() {
  const { client } = useAdminClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload
    }: {
      id: string;
      payload: Partial<Omit<AdminCampPayload, 'hospitalId'>> & { isActive?: boolean };
    }) => client.patch<AdminCamp>('/admin/camps/' + id, payload),
    onSuccess: async () => {
      await invalidateAdmin(queryClient);
    }
  });
}

export function useDeleteAdminCamp() {
  const { client } = useAdminClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => client.delete<{ message: string }>('/admin/camps/' + id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'camps'] });
      const previous = queryClient.getQueryData<AdminCamp[]>(['admin', 'camps']);
      queryClient.setQueryData<AdminCamp[]>(['admin', 'camps'], (current) =>
        current?.map((camp) => (camp.id === id ? { ...camp, isActive: false } : camp))
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(['admin', 'camps'], context.previous);
    },
    onSettled: async () => {
      await invalidateAdmin(queryClient);
    }
  });
}

export function useAdminAnalytics() {
  const { client, enabled } = useAdminClient();
  return useQuery({
    queryKey: ['admin', 'analytics'],
    queryFn: () => client.get<AdminAnalytics>('/admin/analytics'),
    enabled
  });
}

async function invalidateAdmin(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] }),
    queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
    queryClient.invalidateQueries({ queryKey: ['admin', 'hospitals'] }),
    queryClient.invalidateQueries({ queryKey: ['admin', 'camps'] }),
    queryClient.invalidateQueries({ queryKey: ['admin', 'analytics'] })
  ]);
}
