'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { ApiClient } from './api-client';
import { useAuth } from './auth-context';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export type BloodGroup =
  | 'A_POSITIVE'
  | 'A_NEGATIVE'
  | 'B_POSITIVE'
  | 'B_NEGATIVE'
  | 'AB_POSITIVE'
  | 'AB_NEGATIVE'
  | 'O_POSITIVE'
  | 'O_NEGATIVE';

export type RequestUrgency = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RequestStatus = 'OPEN' | 'FULFILLED' | 'CANCELLED';
export type HospitalResponseStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'VERIFIED';

export interface HospitalInventory {
  id: string;
  bloodGroup: BloodGroup;
  unitsAvailable: number;
  unitsReserved: number;
  criticalThreshold: number;
  status: 'OK' | 'LOW_STOCK';
  updatedAt: string;
}

export interface HospitalRequest {
  id: string;
  bloodGroup: BloodGroup;
  unitsRequired: number;
  unitsFulfilled: number;
  urgency: RequestUrgency;
  status: RequestStatus;
  description: string;
  responsesCount: number;
  createdAt: string;
  neededBy: string;
}

export interface HospitalResponse {
  id: string;
  donorName: string;
  donorBloodGroup: BloodGroup;
  requestBloodGroup: BloodGroup;
  responseStatus: HospitalResponseStatus;
  responseDate: string;
  description: string;
}

export interface HospitalCamp {
  id: string;
  title: string;
  venue: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
}

export interface HospitalDashboard {
  inventorySummary: {
    totalUnitsAvailable: number;
    totalUnitsReserved: number;
    bloodGroupsTracked: number;
  };
  lowStockBloodGroups: HospitalInventory[];
  activeRequests: number;
  totalRequests: number;
  totalDonationsReceived: number;
  upcomingCamps: number;
  recentResponses: HospitalResponse[];
}

export interface HospitalAnalytics {
  donationsThisMonth: number;
  bloodGroupDistribution: Array<{ bloodGroup: BloodGroup; count: number }>;
  inventoryLevels: Array<{
    bloodGroup: BloodGroup;
    unitsAvailable: number;
    criticalThreshold: number;
  }>;
  fulfilledRequests: number;
  pendingRequests: number;
  requestStatusDistribution: Array<{ status: string; count: number }>;
}

export type InventoryPayload = {
  bloodGroup: BloodGroup;
  unitsAvailable: number;
  unitsReserved?: number;
  criticalThreshold?: number;
};

export type RequestPayload = {
  bloodGroup: BloodGroup;
  unitsRequired: number;
  urgency: RequestUrgency;
  description: string;
};

export type CampPayload = {
  title: string;
  venue: string;
  startsAt: string;
  endsAt?: string;
  description?: string;
};

function useHospitalClient() {
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

export function useHospitalDashboard() {
  const { client, enabled } = useHospitalClient();
  return useQuery({
    queryKey: ['hospital', 'dashboard'],
    queryFn: () => client.get<HospitalDashboard>('/hospital/dashboard'),
    enabled
  });
}

export function useHospitalInventory() {
  const { client, enabled } = useHospitalClient();
  return useQuery({
    queryKey: ['hospital', 'inventory'],
    queryFn: () => client.get<HospitalInventory[]>('/hospital/inventory'),
    enabled
  });
}

export function useCreateInventory() {
  const { client } = useHospitalClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: InventoryPayload) =>
      client.post<HospitalInventory>('/hospital/inventory', payload),
    onSuccess: async () => {
      await invalidateHospital(queryClient);
    }
  });
}

export function useUpdateInventory() {
  const { client } = useHospitalClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<InventoryPayload> }) =>
      client.patch<HospitalInventory>(`/hospital/inventory/${id}`, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ['hospital', 'inventory'] });
      const previous = queryClient.getQueryData<HospitalInventory[]>(['hospital', 'inventory']);
      queryClient.setQueryData<HospitalInventory[]>(['hospital', 'inventory'], (current) =>
        current?.map((item) =>
          item.id === id
            ? {
                ...item,
                ...payload,
                status:
                  (payload.unitsAvailable ?? item.unitsAvailable) <=
                  (payload.criticalThreshold ?? item.criticalThreshold)
                    ? 'LOW_STOCK'
                    : 'OK'
              }
            : item
        )
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(['hospital', 'inventory'], context.previous);
    },
    onSettled: async () => {
      await invalidateHospital(queryClient);
    }
  });
}

export function useDeleteInventory() {
  const { client } = useHospitalClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => client.delete<{ message: string }>(`/hospital/inventory/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['hospital', 'inventory'] });
      const previous = queryClient.getQueryData<HospitalInventory[]>(['hospital', 'inventory']);
      queryClient.setQueryData<HospitalInventory[]>(['hospital', 'inventory'], (current) =>
        current?.filter((item) => item.id !== id)
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(['hospital', 'inventory'], context.previous);
    },
    onSettled: async () => {
      await invalidateHospital(queryClient);
    }
  });
}

export function useHospitalRequests() {
  const { client, enabled } = useHospitalClient();
  return useQuery({
    queryKey: ['hospital', 'requests'],
    queryFn: () => client.get<HospitalRequest[]>('/hospital/requests'),
    enabled
  });
}

export function useCreateHospitalRequest() {
  const { client } = useHospitalClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RequestPayload) =>
      client.post<HospitalRequest>('/hospital/requests', payload),
    onSuccess: async () => {
      await invalidateHospital(queryClient);
    }
  });
}

export function useUpdateHospitalRequest() {
  const { client } = useHospitalClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<RequestPayload> & { status?: RequestStatus } }) =>
      client.patch<HospitalRequest>(`/hospital/requests/${id}`, payload),
    onSuccess: async () => {
      await invalidateHospital(queryClient);
    }
  });
}

export function useDeleteHospitalRequest() {
  const { client } = useHospitalClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => client.delete<{ message: string }>(`/hospital/requests/${id}`),
    onSuccess: async () => {
      await invalidateHospital(queryClient);
    }
  });
}

export function useHospitalRequestResponses(requestId: string) {
  const { client, enabled } = useHospitalClient();
  return useQuery({
    queryKey: ['hospital', 'requests', requestId, 'responses'],
    queryFn: () => client.get<HospitalResponse[]>(`/hospital/requests/${requestId}/responses`),
    enabled: enabled && Boolean(requestId)
  });
}

export function useUpdateHospitalResponse(requestId?: string) {
  const { client } = useHospitalClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'VERIFIED' | 'REJECTED' }) =>
      client.patch<HospitalResponse>(`/hospital/responses/${id}`, { status }),
    onSuccess: async () => {
      await Promise.all([
        requestId
          ? queryClient.invalidateQueries({ queryKey: ['hospital', 'requests', requestId, 'responses'] })
          : Promise.resolve(),
        invalidateHospital(queryClient)
      ]);
    }
  });
}

export function useHospitalCamps() {
  const { client, enabled } = useHospitalClient();
  return useQuery({
    queryKey: ['hospital', 'camps'],
    queryFn: () => client.get<HospitalCamp[]>('/hospital/camps'),
    enabled
  });
}

export function useCreateHospitalCamp() {
  const { client } = useHospitalClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CampPayload) => client.post<HospitalCamp>('/hospital/camps', payload),
    onSuccess: async () => {
      await invalidateHospital(queryClient);
    }
  });
}

export function useUpdateHospitalCamp() {
  const { client } = useHospitalClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CampPayload> & { isActive?: boolean } }) =>
      client.patch<HospitalCamp>(`/hospital/camps/${id}`, payload),
    onSuccess: async () => {
      await invalidateHospital(queryClient);
    }
  });
}

export function useDeleteHospitalCamp() {
  const { client } = useHospitalClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => client.delete<{ message: string }>(`/hospital/camps/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['hospital', 'camps'] });
      const previous = queryClient.getQueryData<HospitalCamp[]>(['hospital', 'camps']);
      queryClient.setQueryData<HospitalCamp[]>(['hospital', 'camps'], (current) =>
        current?.map((camp) => (camp.id === id ? { ...camp, isActive: false } : camp))
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(['hospital', 'camps'], context.previous);
    },
    onSettled: async () => {
      await invalidateHospital(queryClient);
    }
  });
}

export function useHospitalAnalytics() {
  const { client, enabled } = useHospitalClient();
  return useQuery({
    queryKey: ['hospital', 'analytics'],
    queryFn: () => client.get<HospitalAnalytics>('/hospital/analytics'),
    enabled
  });
}

async function invalidateHospital(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['hospital', 'dashboard'] }),
    queryClient.invalidateQueries({ queryKey: ['hospital', 'inventory'] }),
    queryClient.invalidateQueries({ queryKey: ['hospital', 'requests'] }),
    queryClient.invalidateQueries({ queryKey: ['hospital', 'camps'] }),
    queryClient.invalidateQueries({ queryKey: ['hospital', 'analytics'] })
  ]);
}
