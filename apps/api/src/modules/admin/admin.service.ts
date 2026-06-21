import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  BloodGroup,
  prisma,
  RequestStatus,
  UserRole,
  UserStatus
} from '@red-hope/db';
import { NotificationService } from '../notification/notification.service';
import { CreateAdminCampDto, UpdateAdminCampDto, UpdateUserStatusDto } from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(private readonly notificationService: NotificationService) {}

  async getDashboard() {
    const [
      totalUsers,
      totalDonors,
      totalHospitals,
      approvedHospitals,
      pendingHospitals,
      totalDonationCamps,
      activeBloodRequests,
      totalDonations,
      bloodInventory,
      pendingHospitalApprovals,
      recentBloodRequests,
      recentDonations,
      recentCamps
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: UserRole.DONOR } }),
      prisma.hospitalProfile.count(),
      prisma.hospitalProfile.count({ where: { approved: true } }),
      prisma.hospitalProfile.count({ where: { approved: false } }),
      prisma.bloodDonationCamp.count(),
      prisma.bloodRequest.count({ where: { status: RequestStatus.OPEN } }),
      prisma.donation.count(),
      prisma.bloodInventory.groupBy({
        by: ['bloodGroup'],
        _sum: { unitsAvailable: true, unitsReserved: true }
      }),
      prisma.hospitalProfile.findMany({
        where: { approved: false },
        include: { user: { select: { email: true, status: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      prisma.bloodRequest.findMany({
        include: {
          requestedByHospital: { select: { hospitalName: true, city: true, state: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      prisma.donation.findMany({
        include: {
          donorProfile: { include: { user: { select: { name: true } } } },
          hospital: { select: { hospitalName: true } }
        },
        orderBy: { donatedAt: 'desc' },
        take: 5
      }),
      prisma.bloodDonationCamp.findMany({
        include: {
          organizedByHospital: { select: { hospitalName: true, city: true, state: true } }
        },
        orderBy: { startsAt: 'desc' },
        take: 5
      })
    ]);

    return {
      totalUsers,
      totalDonors,
      totalHospitals,
      approvedHospitals,
      pendingHospitals,
      totalDonationCamps,
      activeBloodRequests,
      totalDonations,
      bloodInventorySummary: bloodInventory.map((item) => ({
        bloodGroup: item.bloodGroup,
        unitsAvailable: item._sum.unitsAvailable ?? 0,
        unitsReserved: item._sum.unitsReserved ?? 0
      })),
      pendingHospitalApprovals: pendingHospitalApprovals.map((hospital) =>
        this.toHospitalDto(hospital)
      ),
      recentBloodRequests: recentBloodRequests.map((request) => ({
        id: request.id,
        hospitalName: request.requestedByHospital.hospitalName,
        bloodGroup: request.bloodGroup,
        unitsRequired: request.unitsRequired,
        urgency: request.urgency,
        status: request.status,
        city: request.requestedByHospital.city,
        state: request.requestedByHospital.state,
        createdAt: request.createdAt
      })),
      recentDonations: recentDonations.map((donation) => ({
        id: donation.id,
        donorName: donation.donorProfile.user.name,
        hospitalName: donation.hospital?.hospitalName ?? 'Unknown hospital',
        bloodGroup: donation.bloodGroup,
        unitsDonated: donation.unitsDonated,
        donatedAt: donation.donatedAt
      })),
      recentCamps: recentCamps.map((camp) => this.toCampDto(camp))
    };
  }

  async getUsers() {
    const users = await prisma.user.findMany({
      include: {
        hospitalProfile: { select: { id: true, hospitalName: true, approved: true } },
        donorProfile: { select: { id: true, bloodGroup: true, city: true, state: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return users.map((user) => this.toUserDto(user));
  }

  async getUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        hospitalProfile: {
          select: {
            id: true,
            hospitalName: true,
            licenseNumber: true,
            city: true,
            state: true,
            approved: true
          }
        },
        donorProfile: {
          select: { id: true, bloodGroup: true, city: true, state: true, isEligible: true }
        }
      }
    });

    if (!user) throw new NotFoundException('User not found.');
    return this.toUserDto(user);
  }

  async updateUser(userId: string, dto: UpdateUserStatusDto) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { status: dto.status },
      include: {
        hospitalProfile: { select: { id: true, hospitalName: true, approved: true } },
        donorProfile: { select: { id: true, bloodGroup: true, city: true, state: true } }
      }
    });

    if (dto.status === UserStatus.SUSPENDED && user.status !== UserStatus.SUSPENDED) {
      await this.notificationService.notifyUserSuspended(userId);
    }

    return this.toUserDto(updated);
  }

  async getHospitals() {
    const hospitals = await prisma.hospitalProfile.findMany({
      include: {
        user: { select: { email: true, status: true, createdAt: true } },
        _count: { select: { inventories: true, requests: true, camps: true, donations: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return hospitals.map((hospital) => this.toHospitalDto(hospital));
  }

  async getHospital(hospitalId: string) {
    const hospital = await prisma.hospitalProfile.findUnique({
      where: { id: hospitalId },
      include: {
        user: { select: { email: true, status: true, createdAt: true } },
        inventories: true,
        requests: { orderBy: { createdAt: 'desc' }, take: 10 },
        camps: { orderBy: { startsAt: 'desc' }, take: 10 },
        _count: { select: { inventories: true, requests: true, camps: true, donations: true } }
      }
    });

    if (!hospital) throw new NotFoundException('Hospital not found.');
    return this.toHospitalDto(hospital);
  }

  async approveHospital(hospitalId: string) {
    const hospital = await this.getExistingHospital(hospitalId);
    const wasApproved = hospital.approved;

    const updated = await prisma.hospitalProfile.update({
      where: { id: hospital.id },
      data: {
        approved: true,
        user: { update: { status: UserStatus.ACTIVE } }
      },
      include: {
        user: { select: { email: true, status: true, createdAt: true } },
        _count: { select: { inventories: true, requests: true, camps: true, donations: true } }
      }
    });

    if (!wasApproved) {
      await this.notificationService.notifyHospitalApproved(updated.userId);
    }

    return this.toHospitalDto(updated);
  }

  async rejectHospital(hospitalId: string) {
    const hospital = await this.getExistingHospital(hospitalId);
    const user = await prisma.user.findUnique({
      where: { id: hospital.userId },
      select: { status: true }
    });
    const userWasSuspended = user?.status === UserStatus.SUSPENDED;

    const updated = await prisma.hospitalProfile.update({
      where: { id: hospital.id },
      data: {
        approved: false,
        user: { update: { status: UserStatus.SUSPENDED } }
      },
      include: {
        user: { select: { email: true, status: true, createdAt: true } },
        _count: { select: { inventories: true, requests: true, camps: true, donations: true } }
      }
    });

    if (!userWasSuspended) {
      await this.notificationService.notifyUserSuspended(updated.userId);
    }

    return this.toHospitalDto(updated);
  }

  async getCamps() {
    const camps = await prisma.bloodDonationCamp.findMany({
      include: {
        organizedByHospital: { select: { hospitalName: true, city: true, state: true } }
      },
      orderBy: { startsAt: 'desc' }
    });

    return camps.map((camp) => this.toCampDto(camp));
  }

  async createCamp(dto: CreateAdminCampDto) {
    const hospital = await this.getExistingHospital(dto.hospitalId);
    const startsAt = new Date(dto.startsAt);
    const endsAt = dto.endsAt ? new Date(dto.endsAt) : new Date(startsAt.getTime() + 4 * 60 * 60 * 1000);
    this.validateCampDates(startsAt, endsAt);

    const camp = await prisma.bloodDonationCamp.create({
      data: {
        name: dto.title,
        description: dto.description,
        organizedByHospitalId: hospital.id,
        address: dto.venue,
        city: hospital.city,
        state: hospital.state,
        postalCode: hospital.postalCode,
        startsAt,
        endsAt,
        contactNumber: hospital.contactNumber
      },
      include: {
        organizedByHospital: { select: { hospitalName: true, city: true, state: true } }
      }
    });

    await this.notificationService.notifyDonorsForCamp(camp.id);

    return this.toCampDto(camp);
  }

  async updateCamp(campId: string, dto: UpdateAdminCampDto) {
    const existing = await prisma.bloodDonationCamp.findUnique({ where: { id: campId } });
    if (!existing) throw new NotFoundException('Donation camp not found.');

    const startsAt = dto.startsAt ? new Date(dto.startsAt) : existing.startsAt;
    const endsAt = dto.endsAt ? new Date(dto.endsAt) : existing.endsAt;
    this.validateCampDates(startsAt, endsAt);

    const camp = await prisma.bloodDonationCamp.update({
      where: { id: campId },
      data: {
        name: dto.title,
        description: dto.description,
        address: dto.venue,
        startsAt,
        endsAt,
        isActive: dto.isActive
      },
      include: {
        organizedByHospital: { select: { hospitalName: true, city: true, state: true } }
      }
    });

    return this.toCampDto(camp);
  }

  async deleteCamp(campId: string) {
    const existing = await prisma.bloodDonationCamp.findUnique({ where: { id: campId } });
    if (!existing) throw new NotFoundException('Donation camp not found.');

    await prisma.bloodDonationCamp.update({
      where: { id: campId },
      data: { isActive: false }
    });

    return { message: 'Donation camp deactivated.' };
  }

  async getAnalytics() {
    const [
      usersByRole,
      donations,
      requestsByUrgency,
      requestStatusDistribution,
      inventoryByBloodGroup,
      hospitalActivity,
      donorActivity,
      users,
      hospitals
    ] = await Promise.all([
      prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
      prisma.donation.findMany({
        select: { donatedAt: true, bloodGroup: true },
        orderBy: { donatedAt: 'asc' }
      }),
      prisma.bloodRequest.groupBy({ by: ['urgency'], _count: { _all: true } }),
      prisma.bloodRequest.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.bloodInventory.groupBy({
        by: ['bloodGroup'],
        _sum: { unitsAvailable: true }
      }),
      prisma.hospitalProfile.findMany({
        include: {
          _count: { select: { requests: true, donations: true, camps: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 8
      }),
      prisma.donorProfile.findMany({
        include: {
          user: { select: { name: true } },
          _count: { select: { donations: true, responses: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 8
      }),
      prisma.user.findMany({ select: { createdAt: true } }),
      prisma.hospitalProfile.findMany({ select: { createdAt: true } })
    ]);

    return {
      usersByRole: usersByRole.map((item) => ({ role: item.role, count: item._count._all })),
      donationsPerMonth: this.groupDatesByMonth(donations.map((donation) => donation.donatedAt)),
      requestsByUrgency: requestsByUrgency.map((item) => ({
        urgency: item.urgency,
        count: item._count._all
      })),
      requestStatusDistribution: requestStatusDistribution.map((item) => ({
        status: item.status,
        count: item._count._all
      })),
      inventoryByBloodGroup: inventoryByBloodGroup.map((item) => ({
        bloodGroup: item.bloodGroup,
        unitsAvailable: item._sum.unitsAvailable ?? 0
      })),
      hospitalActivity: hospitalActivity.map((hospital) => ({
        id: hospital.id,
        hospitalName: hospital.hospitalName,
        requests: hospital._count.requests,
        donations: hospital._count.donations,
        camps: hospital._count.camps
      })),
      donorActivity: donorActivity.map((donor) => ({
        id: donor.id,
        donorName: donor.user.name,
        donations: donor._count.donations,
        responses: donor._count.responses
      })),
      userGrowth: this.groupDatesByMonth(users.map((user) => user.createdAt)),
      hospitalGrowth: this.groupDatesByMonth(hospitals.map((hospital) => hospital.createdAt)),
      bloodDistribution: this.groupBloodGroups(donations.map((donation) => donation.bloodGroup))
    };
  }

  private async getExistingHospital(hospitalId: string) {
    const hospital = await prisma.hospitalProfile.findUnique({ where: { id: hospitalId } });
    if (!hospital) throw new NotFoundException('Hospital not found.');
    return hospital;
  }

  private validateCampDates(startsAt: Date, endsAt: Date) {
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      throw new BadRequestException('Invalid camp dates.');
    }
    if (endsAt <= startsAt) {
      throw new BadRequestException('Camp end time must be after start time.');
    }
  }

  private groupDatesByMonth(dates: Date[]) {
    const months = new Map<string, number>();
    for (let offset = 5; offset >= 0; offset -= 1) {
      const date = new Date();
      date.setDate(1);
      date.setHours(0, 0, 0, 0);
      date.setMonth(date.getMonth() - offset);
      months.set(this.monthKey(date), 0);
    }

    dates.forEach((date) => {
      const key = this.monthKey(date);
      if (months.has(key)) months.set(key, (months.get(key) ?? 0) + 1);
    });

    return Array.from(months, ([month, count]) => ({ month, count }));
  }

  private monthKey(date: Date) {
    return date.toLocaleString('en-US', { month: 'short', year: '2-digit' });
  }

  private groupBloodGroups(values: BloodGroup[]) {
    const counts = new Map<BloodGroup, number>();
    values.forEach((bloodGroup) => counts.set(bloodGroup, (counts.get(bloodGroup) ?? 0) + 1));
    return Array.from(counts, ([bloodGroup, count]) => ({ bloodGroup, count }));
  }

  private toUserDto(user: {
    id: string;
    email: string;
    phoneNumber: string | null;
    name: string;
    role: UserRole;
    status: UserStatus;
    createdAt: Date;
    hospitalProfile?: { id: string; hospitalName: string; approved: boolean } | null;
    donorProfile?: { id: string; bloodGroup: BloodGroup; city: string; state: string } | null;
  }) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      hospital: user.hospitalProfile
        ? {
            id: user.hospitalProfile.id,
            name: user.hospitalProfile.hospitalName,
            approved: user.hospitalProfile.approved
          }
        : null,
      donor: user.donorProfile
        ? {
            id: user.donorProfile.id,
            bloodGroup: user.donorProfile.bloodGroup,
            city: user.donorProfile.city,
            state: user.donorProfile.state
          }
        : null
    };
  }

  private toHospitalDto(hospital: {
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
    createdAt: Date;
    user?: { email: string; status: UserStatus; createdAt?: Date };
    _count?: { inventories?: number; requests?: number; camps?: number; donations?: number };
  }) {
    return {
      id: hospital.id,
      userId: hospital.userId,
      hospitalName: hospital.hospitalName,
      licenseNumber: hospital.licenseNumber,
      contactNumber: hospital.contactNumber,
      address: hospital.address,
      city: hospital.city,
      state: hospital.state,
      postalCode: hospital.postalCode,
      approved: hospital.approved,
      approvalStatus: hospital.approved ? 'APPROVED' : 'PENDING',
      email: hospital.user?.email ?? null,
      userStatus: hospital.user?.status ?? null,
      createdAt: hospital.createdAt,
      counts: {
        inventories: hospital._count?.inventories ?? 0,
        requests: hospital._count?.requests ?? 0,
        camps: hospital._count?.camps ?? 0,
        donations: hospital._count?.donations ?? 0
      }
    };
  }

  private toCampDto(camp: {
    id: string;
    name: string;
    description: string | null;
    address: string;
    city: string;
    state: string;
    startsAt: Date;
    endsAt: Date;
    isActive: boolean;
    organizedByHospital: { hospitalName: string; city: string; state: string };
  }) {
    return {
      id: camp.id,
      title: camp.name,
      venue: camp.address,
      city: camp.city,
      state: camp.state,
      description: camp.description,
      startsAt: camp.startsAt,
      endsAt: camp.endsAt,
      isActive: camp.isActive,
      hospitalName: camp.organizedByHospital.hospitalName,
      hospitalCity: camp.organizedByHospital.city,
      hospitalState: camp.organizedByHospital.state
    };
  }
}
