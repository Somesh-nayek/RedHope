import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { Prisma, RequestStatus, RequestUrgency, prisma } from '@red-hope/db';
import {
  DonationHistoryDto,
  DonorCampDto,
  DonorDashboardDto,
  DonorNotificationDto,
  DonorRequestDto,
  EligibilityDto
} from './dto/donor-response.dto';
import { NotificationService } from '../notification/notification.service';

const ELIGIBILITY_DAYS = 90;
const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class DonorService {
  constructor(private readonly notificationService: NotificationService) {}

  async getDashboard(userId: string): Promise<DonorDashboardDto> {
    const donor = await this.getDonorProfile(userId);
    const now = new Date();

    const [totalDonations, latestDonation, activeRequestsCount, upcomingCampsCount, unreadNotificationsCount] =
      await Promise.all([
        prisma.donation.count({ where: { donorProfileId: donor.id } }),
        prisma.donation.findFirst({
          where: { donorProfileId: donor.id },
          orderBy: { donatedAt: 'desc' },
          select: { donatedAt: true }
        }),
        prisma.bloodRequest.count({ where: { status: RequestStatus.OPEN } }),
        prisma.bloodDonationCamp.count({
          where: { isActive: true, startsAt: { gte: now } }
        }),
        prisma.notification.count({ where: { userId, isRead: false } })
      ]);

    const eligibility = this.calculateEligibility(latestDonation?.donatedAt ?? null, now);

    return {
      totalDonations,
      eligibility,
      nextEligibleDate: eligibility.nextEligibleDate,
      daysRemaining: eligibility.daysRemaining,
      activeRequestsCount,
      upcomingCampsCount,
      unreadNotificationsCount
    };
  }

  async getRequests(): Promise<DonorRequestDto[]> {
    const requests = await prisma.bloodRequest.findMany({
      where: { status: RequestStatus.OPEN },
      include: { requestedByHospital: { select: { hospitalName: true } } }
    });

    const urgencyWeight: Record<RequestUrgency, number> = {
      CRITICAL: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1
    };

    return requests
      .sort(
        (left, right) =>
          urgencyWeight[right.urgency] - urgencyWeight[left.urgency] ||
          right.createdAt.getTime() - left.createdAt.getTime()
      )
      .map((request) => ({
        requestId: request.id,
        hospitalName: request.requestedByHospital.hospitalName,
        bloodGroup: request.bloodGroup,
        unitsRequired: request.unitsRequired,
        urgency: request.urgency === RequestUrgency.MEDIUM ? 'MODERATE' : request.urgency,
        description: request.reason,
        city: request.locationCity,
        state: request.locationState,
        createdAt: request.createdAt
      }));
  }

  async getEligibility(userId: string): Promise<EligibilityDto> {
    const donor = await this.getDonorProfile(userId);
    const latestDonation = await prisma.donation.findFirst({
      where: { donorProfileId: donor.id },
      orderBy: { donatedAt: 'desc' },
      select: { donatedAt: true }
    });

    return this.calculateEligibility(latestDonation?.donatedAt ?? null);
  }

  async respondToRequest(userId: string, requestId: string): Promise<{ message: string }> {
    const donor = await this.getDonorProfile(userId);
    const latestDonation = await prisma.donation.findFirst({
      where: { donorProfileId: donor.id },
      orderBy: { donatedAt: 'desc' },
      select: { donatedAt: true }
    });

    if (!this.calculateEligibility(latestDonation?.donatedAt ?? null).eligible) {
      throw new BadRequestException('Donor is not currently eligible to donate.');
    }

    try {
      await prisma.$transaction(async (transaction) => {
        const request = await transaction.bloodRequest.findUnique({
          where: { id: requestId },
          select: { status: true }
        });

        if (!request) throw new NotFoundException('Blood request not found.');
        if (request.status !== RequestStatus.OPEN) {
          throw new BadRequestException('Blood request is no longer open.');
        }

        const existingResponse = await transaction.donationResponse.findUnique({
          where: {
            bloodRequestId_donorProfileId: {
              bloodRequestId: requestId,
              donorProfileId: donor.id
            }
          }
        });

        if (existingResponse) {
          throw new ConflictException('You have already responded to this request.');
        }

        await transaction.donationResponse.create({
          data: { bloodRequestId: requestId, donorProfileId: donor.id }
        });
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('You have already responded to this request.');
      }
      throw error;
    }

    return { message: 'Response submitted successfully.' };
  }

  async getCamps(): Promise<DonorCampDto[]> {
    const camps = await prisma.bloodDonationCamp.findMany({
      where: { isActive: true, startsAt: { gte: new Date() } },
      include: { organizedByHospital: { select: { hospitalName: true } } },
      orderBy: { startsAt: 'asc' }
    });

    return camps.map((camp) => ({
      id: camp.id,
      title: camp.name,
      description: camp.description,
      venue: `${camp.address}, ${camp.city}, ${camp.state}`,
      date: camp.startsAt,
      hospitalName: camp.organizedByHospital.hospitalName
    }));
  }

  async getHistory(userId: string): Promise<DonationHistoryDto[]> {
    const donor = await this.getDonorProfile(userId);
    const donations = await prisma.donation.findMany({
      where: { donorProfileId: donor.id },
      include: {
        hospital: { select: { hospitalName: true } },
        camp: {
          select: {
            organizedByHospital: { select: { hospitalName: true } }
          }
        }
      },
      orderBy: { donatedAt: 'desc' }
    });

    return donations.map((donation) => ({
      id: donation.id,
      donationDate: donation.donatedAt,
      hospitalName:
        donation.hospital?.hospitalName ??
        donation.camp?.organizedByHospital.hospitalName ??
        'Not recorded',
      bloodGroup: donation.bloodGroup,
      verified: donation.screeningPassed
    }));
  }

  async getNotifications(userId: string): Promise<DonorNotificationDto[]> {
    const notifications = await this.notificationService.listForUser(userId, { limit: 50 });
    return notifications.items.map((notification) => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      isRead: notification.isRead,
      createdAt: notification.createdAt
    }));
  }

  async markNotificationRead(userId: string, notificationId: string): Promise<{ message: string }> {
    return this.notificationService.markRead(userId, notificationId);
  }

  private async getDonorProfile(userId: string) {
    const donor = await prisma.donorProfile.findUnique({
      where: { userId },
      select: { id: true }
    });
    if (!donor) throw new NotFoundException('Donor profile not found.');
    return donor;
  }

  private calculateEligibility(lastDonationDate: Date | null, today = new Date()): EligibilityDto {
    if (!lastDonationDate) {
      return { eligible: true, nextEligibleDate: null, daysRemaining: 0 };
    }

    const nextEligibleDate = new Date(lastDonationDate.getTime() + ELIGIBILITY_DAYS * DAY_MS);
    const remainingMs = nextEligibleDate.getTime() - today.getTime();
    const daysRemaining = Math.max(0, Math.ceil(remainingMs / DAY_MS));

    return {
      eligible: daysRemaining === 0,
      nextEligibleDate,
      daysRemaining
    };
  }
}
