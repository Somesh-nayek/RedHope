import { z } from 'zod';

export enum UserRole {
  Admin = 'admin',
  Manager = 'manager',
  Volunteer = 'volunteer',
  Viewer = 'viewer'
}

export enum DonationStatus {
  Pending = 'pending',
  Completed = 'completed',
  Failed = 'failed',
  Refunded = 'refunded'
}

export const loginDtoSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const registerDtoSchema = loginDtoSchema.extend({
  name: z.string().min(2),
  role: z.nativeEnum(UserRole).default(UserRole.Viewer)
});

export const donationDtoSchema = z.object({
  donorName: z.string().min(2),
  donorEmail: z.string().email(),
  amountCents: z.number().int().positive(),
  status: z.nativeEnum(DonationStatus).default(DonationStatus.Pending)
});

export type LoginDto = z.infer<typeof loginDtoSchema>;
export type RegisterDto = z.infer<typeof registerDtoSchema>;
export type CreateDonationDto = z.infer<typeof donationDtoSchema>;

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}
