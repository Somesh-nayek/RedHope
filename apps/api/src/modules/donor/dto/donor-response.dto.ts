import { ApiProperty } from '@nestjs/swagger';

export class EligibilityDto {
  @ApiProperty()
  eligible: boolean;

  @ApiProperty({ nullable: true })
  nextEligibleDate: Date | null;

  @ApiProperty()
  daysRemaining: number;
}

export class DonorDashboardDto {
  @ApiProperty()
  totalDonations: number;

  @ApiProperty({ type: EligibilityDto })
  eligibility: EligibilityDto;

  @ApiProperty({ nullable: true })
  nextEligibleDate: Date | null;

  @ApiProperty()
  daysRemaining: number;

  @ApiProperty()
  activeRequestsCount: number;

  @ApiProperty()
  upcomingCampsCount: number;

  @ApiProperty()
  unreadNotificationsCount: number;
}

export class DonorRequestDto {
  requestId: string;
  hospitalName: string;
  bloodGroup: string;
  unitsRequired: number;
  urgency: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  description: string;
  city: string;
  state: string;
  createdAt: Date;
}

export class DonorCampDto {
  id: string;
  title: string;
  description: string | null;
  venue: string;
  date: Date;
  hospitalName: string;
}

export class DonationHistoryDto {
  id: string;
  donationDate: Date;
  hospitalName: string;
  bloodGroup: string;
  verified: boolean;
}

export class DonorNotificationDto {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}
