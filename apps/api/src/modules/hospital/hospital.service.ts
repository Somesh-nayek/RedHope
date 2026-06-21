import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import {
  BloodGroup,
  Prisma,
  RequestStatus,
  ResponseStatus,
  prisma
} from '@red-hope/db';
import {
  CreateBloodRequestDto,
  CreateCampDto,
  UpdateBloodRequestDto,
  UpdateCampDto,
  UpdateInventoryDto,
  UpdateResponseDto,
  UpsertInventoryDto
} from './dto/hospital.dto';
import { NotificationService } from '../notification/notification.service';

const RESPONSE_STATUS_LABEL: Record<ResponseStatus, 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'VERIFIED'> = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'VERIFIED'
};

const REQUEST_STATUSES_ALLOWED_FOR_UPDATE = new Set<RequestStatus>([
  RequestStatus.OPEN,
  RequestStatus.FULFILLED,
  RequestStatus.CANCELLED
]);

@Injectable()
export class HospitalService {
  constructor(private readonly notificationService: NotificationService) {}

  async getDashboard(userId: string) {
    const hospital = await this.getHospitalProfile(userId);
    const now = new Date();

    const [
      inventory,
      activeRequests,
      totalRequests,
      totalDonationsReceived,
      upcomingCamps,
      recentResponses
    ] = await Promise.all([
      prisma.bloodInventory.findMany({
        where: { hospitalId: hospital.id },
        orderBy: { bloodGroup: 'asc' }
      }),
      prisma.bloodRequest.count({
        where: { requestedByHospitalId: hospital.id, status: RequestStatus.OPEN }
      }),
      prisma.bloodRequest.count({ where: { requestedByHospitalId: hospital.id } }),
      prisma.donation.count({ where: { hospitalId: hospital.id } }),
      prisma.bloodDonationCamp.count({
        where: { organizedByHospitalId: hospital.id, isActive: true, startsAt: { gte: now } }
      }),
      prisma.donationResponse.findMany({
        where: { bloodRequest: { requestedByHospitalId: hospital.id } },
        include: {
          donorProfile: { include: { user: { select: { name: true } } } },
          bloodRequest: { select: { bloodGroup: true, reason: true } }
        },
        orderBy: { respondedAt: 'desc' },
        take: 5
      })
    ]);

    const lowStockBloodGroups = inventory.filter(
      (item) => item.unitsAvailable <= item.minimumThreshold
    );

    return {
      inventorySummary: this.toInventorySummary(inventory),
      lowStockBloodGroups: lowStockBloodGroups.map((item) => this.toInventoryDto(item)),
      activeRequests,
      totalRequests,
      totalDonationsReceived,
      upcomingCamps,
      recentResponses: recentResponses.map((response) => this.toResponseDto(response))
    };
  }

  async getInventory(userId: string) {
    const hospital = await this.getHospitalProfile(userId);
    const inventory = await prisma.bloodInventory.findMany({
      where: { hospitalId: hospital.id },
      orderBy: { bloodGroup: 'asc' }
    });

    return inventory.map((item) => this.toInventoryDto(item));
  }

  async createInventory(userId: string, dto: UpsertInventoryDto) {
    const hospital = await this.getHospitalProfile(userId);
    this.validateInventoryCounts(dto.unitsAvailable, dto.unitsReserved ?? 0);

    try {
      const inventory = await prisma.bloodInventory.create({
        data: {
          hospitalId: hospital.id,
          bloodGroup: dto.bloodGroup,
          unitsAvailable: dto.unitsAvailable,
          unitsReserved: dto.unitsReserved ?? 0,
          minimumThreshold: dto.criticalThreshold ?? 5
        }
      });
      return this.toInventoryDto(inventory);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Inventory already exists for this blood group.');
      }
      throw error;
    }
  }

  async updateInventory(userId: string, inventoryId: string, dto: UpdateInventoryDto) {
    const hospital = await this.getHospitalProfile(userId);
    const existing = await this.getOwnedInventory(hospital.id, inventoryId);
    const unitsAvailable = dto.unitsAvailable ?? existing.unitsAvailable;
    const unitsReserved = dto.unitsReserved ?? existing.unitsReserved;
    this.validateInventoryCounts(unitsAvailable, unitsReserved);

    const inventory = await prisma.bloodInventory.update({
      where: { id: inventoryId },
      data: {
        unitsAvailable,
        unitsReserved,
        minimumThreshold: dto.criticalThreshold ?? existing.minimumThreshold
      }
    });

    return this.toInventoryDto(inventory);
  }

  async deleteInventory(userId: string, inventoryId: string) {
    const hospital = await this.getHospitalProfile(userId);
    await this.getOwnedInventory(hospital.id, inventoryId);
    await prisma.bloodInventory.delete({ where: { id: inventoryId } });
    return { message: 'Inventory record deleted.' };
  }

  async getRequests(userId: string) {
    const hospital = await this.getHospitalProfile(userId);
    const requests = await prisma.bloodRequest.findMany({
      where: { requestedByHospitalId: hospital.id },
      include: { responses: { select: { id: true } } },
      orderBy: { createdAt: 'desc' }
    });

    return requests.map((request) => ({
      id: request.id,
      bloodGroup: request.bloodGroup,
      unitsRequired: request.unitsRequired,
      unitsFulfilled: request.unitsFulfilled,
      urgency: request.urgency,
      status: request.status,
      description: request.reason,
      responsesCount: request.responses.length,
      createdAt: request.createdAt,
      neededBy: request.neededBy
    }));
  }

  async createRequest(userId: string, dto: CreateBloodRequestDto) {
    const hospital = await this.getHospitalProfile(userId);
    const request = await prisma.bloodRequest.create({
      data: {
        requestedByHospitalId: hospital.id,
        createdByUserId: userId,
        bloodGroup: dto.bloodGroup,
        unitsRequired: dto.unitsRequired,
        urgency: dto.urgency,
        neededBy: dto.neededBy ? new Date(dto.neededBy) : this.defaultNeededBy(dto.urgency),
        reason: dto.description,
        contactNumber: hospital.contactNumber,
        locationCity: hospital.city,
        locationState: hospital.state
      },
      include: { responses: { select: { id: true } } }
    });

    await this.notificationService.notifyMatchingDonorsForBloodRequest(request.id);

    return {
      id: request.id,
      bloodGroup: request.bloodGroup,
      unitsRequired: request.unitsRequired,
      unitsFulfilled: request.unitsFulfilled,
      urgency: request.urgency,
      status: request.status,
      description: request.reason,
      responsesCount: request.responses.length,
      createdAt: request.createdAt,
      neededBy: request.neededBy
    };
  }

  async updateRequest(userId: string, requestId: string, dto: UpdateBloodRequestDto) {
    const hospital = await this.getHospitalProfile(userId);
    const existing = await this.getOwnedRequest(hospital.id, requestId);

    if (dto.status && !REQUEST_STATUSES_ALLOWED_FOR_UPDATE.has(dto.status)) {
      throw new BadRequestException('Request status can only be OPEN, FULFILLED, or CANCELLED.');
    }

    const request = await prisma.bloodRequest.update({
      where: { id: requestId },
      data: {
        bloodGroup: dto.bloodGroup,
        unitsRequired: dto.unitsRequired,
        urgency: dto.urgency,
        reason: dto.description,
        status: dto.status,
        unitsFulfilled:
          dto.status === RequestStatus.FULFILLED
            ? dto.unitsRequired ?? existing.unitsRequired
            : undefined
      },
      include: { responses: { select: { id: true } } }
    });

    if (dto.status === RequestStatus.FULFILLED && existing.status !== RequestStatus.FULFILLED) {
      await this.notificationService.notifyBloodRequestFulfilled(request.id);
    }

    return {
      id: request.id,
      bloodGroup: request.bloodGroup,
      unitsRequired: request.unitsRequired,
      unitsFulfilled: request.unitsFulfilled,
      urgency: request.urgency,
      status: request.status,
      description: request.reason,
      responsesCount: request.responses.length,
      createdAt: request.createdAt,
      neededBy: request.neededBy
    };
  }

  async deleteRequest(userId: string, requestId: string) {
    const hospital = await this.getHospitalProfile(userId);
    await this.getOwnedRequest(hospital.id, requestId);
    await prisma.bloodRequest.update({
      where: { id: requestId },
      data: { status: RequestStatus.CANCELLED }
    });
    return { message: 'Blood request cancelled.' };
  }

  async getRequestResponses(userId: string, requestId: string) {
    const hospital = await this.getHospitalProfile(userId);
    await this.getOwnedRequest(hospital.id, requestId);
    const responses = await prisma.donationResponse.findMany({
      where: { bloodRequestId: requestId },
      include: {
        donorProfile: { include: { user: { select: { name: true } } } },
        bloodRequest: { select: { bloodGroup: true, reason: true } }
      },
      orderBy: { respondedAt: 'desc' }
    });

    return responses.map((response) => this.toResponseDto(response));
  }

  async updateResponse(userId: string, responseId: string, dto: UpdateResponseDto) {
    const hospital = await this.getHospitalProfile(userId);
    const response = await prisma.donationResponse.findFirst({
      where: { id: responseId, bloodRequest: { requestedByHospitalId: hospital.id } },
      include: {
        donorProfile: { include: { user: { select: { name: true } } } },
        bloodRequest: { select: { id: true, bloodGroup: true, reason: true, status: true } }
      }
    });

    if (!response) throw new NotFoundException('Donor response not found.');
    if (dto.status === 'REJECTED') {
      const rejected = await prisma.donationResponse.update({
        where: { id: responseId },
        data: { status: ResponseStatus.REJECTED },
        include: {
          donorProfile: { include: { user: { select: { name: true } } } },
          bloodRequest: { select: { bloodGroup: true, reason: true } }
        }
      });
      return this.toResponseDto(rejected);
    }

    if (response.donationId || response.status === ResponseStatus.COMPLETED) {
      throw new ConflictException('Donation response is already verified.');
    }

    const verified = await prisma.$transaction(async (transaction) => {
      const donation = await transaction.donation.create({
        data: {
          donorProfileId: response.donorProfileId,
          hospitalId: hospital.id,
          bloodRequestId: response.bloodRequestId,
          bloodGroup: response.bloodRequest.bloodGroup,
          unitsDonated: 1,
          screeningPassed: true
        }
      });

      await transaction.donorProfile.update({
        where: { id: response.donorProfileId },
        data: { lastDonationAt: donation.donatedAt, isEligible: false }
      });

      return transaction.donationResponse.update({
        where: { id: responseId },
        data: { status: ResponseStatus.COMPLETED, donationId: donation.id },
        include: {
          donorProfile: { include: { user: { select: { name: true } } } },
          bloodRequest: { select: { bloodGroup: true, reason: true } }
        }
      });
    });

    await this.notificationService.notifyDonationResponseVerified(verified.id);

    return this.toResponseDto(verified);
  }

  async getCamps(userId: string) {
    const hospital = await this.getHospitalProfile(userId);
    const camps = await prisma.bloodDonationCamp.findMany({
      where: { organizedByHospitalId: hospital.id },
      orderBy: { startsAt: 'asc' }
    });

    return camps.map((camp) => this.toCampDto(camp));
  }

  async createCamp(userId: string, dto: CreateCampDto) {
    const hospital = await this.getHospitalProfile(userId);
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
        startsAt,
        endsAt,
        contactNumber: hospital.contactNumber
      }
    });

    await this.notificationService.notifyDonorsForCamp(camp.id);

    return this.toCampDto(camp);
  }

  async updateCamp(userId: string, campId: string, dto: UpdateCampDto) {
    const hospital = await this.getHospitalProfile(userId);
    const existing = await this.getOwnedCamp(hospital.id, campId);
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
      }
    });

    return this.toCampDto(camp);
  }

  async deleteCamp(userId: string, campId: string) {
    const hospital = await this.getHospitalProfile(userId);
    await this.getOwnedCamp(hospital.id, campId);
    await prisma.bloodDonationCamp.update({
      where: { id: campId },
      data: { isActive: false }
    });
    return { message: 'Donation camp deactivated.' };
  }

  async getAnalytics(userId: string) {
    const hospital = await this.getHospitalProfile(userId);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [donationsThisMonth, donationsByBloodGroup, inventory, fulfilledRequests, pendingRequests] =
      await Promise.all([
        prisma.donation.count({
          where: { hospitalId: hospital.id, donatedAt: { gte: monthStart } }
        }),
        prisma.donation.groupBy({
          by: ['bloodGroup'],
          where: { hospitalId: hospital.id },
          _count: { _all: true }
        }),
        prisma.bloodInventory.findMany({
          where: { hospitalId: hospital.id },
          orderBy: { bloodGroup: 'asc' }
        }),
        prisma.bloodRequest.count({
          where: { requestedByHospitalId: hospital.id, status: RequestStatus.FULFILLED }
        }),
        prisma.bloodRequest.count({
          where: { requestedByHospitalId: hospital.id, status: RequestStatus.OPEN }
        })
      ]);

    return {
      donationsThisMonth,
      bloodGroupDistribution: donationsByBloodGroup.map((item) => ({
        bloodGroup: item.bloodGroup,
        count: item._count._all
      })),
      inventoryLevels: inventory.map((item) => ({
        bloodGroup: item.bloodGroup,
        unitsAvailable: item.unitsAvailable,
        criticalThreshold: item.minimumThreshold
      })),
      fulfilledRequests,
      pendingRequests,
      requestStatusDistribution: [
        { status: 'FULFILLED', count: fulfilledRequests },
        { status: 'PENDING', count: pendingRequests }
      ]
    };
  }

  private async getHospitalProfile(userId: string) {
    const hospital = await prisma.hospitalProfile.findUnique({ where: { userId } });
    if (!hospital) throw new NotFoundException('Hospital profile not found.');
    return hospital;
  }

  private async getOwnedInventory(hospitalId: string, inventoryId: string) {
    const inventory = await prisma.bloodInventory.findFirst({
      where: { id: inventoryId, hospitalId }
    });
    if (!inventory) throw new NotFoundException('Inventory record not found.');
    return inventory;
  }

  private async getOwnedRequest(hospitalId: string, requestId: string) {
    const request = await prisma.bloodRequest.findFirst({
      where: { id: requestId, requestedByHospitalId: hospitalId }
    });
    if (!request) throw new NotFoundException('Blood request not found.');
    return request;
  }

  private async getOwnedCamp(hospitalId: string, campId: string) {
    const camp = await prisma.bloodDonationCamp.findFirst({
      where: { id: campId, organizedByHospitalId: hospitalId }
    });
    if (!camp) throw new NotFoundException('Donation camp not found.');
    return camp;
  }

  private validateInventoryCounts(unitsAvailable: number, unitsReserved: number) {
    if (unitsAvailable < 0 || unitsReserved < 0) {
      throw new BadRequestException('Inventory counts cannot be negative.');
    }
    if (unitsReserved > unitsAvailable) {
      throw new BadRequestException('Reserved units cannot exceed available units.');
    }
  }

  private validateCampDates(startsAt: Date, endsAt: Date) {
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      throw new BadRequestException('Invalid camp dates.');
    }
    if (endsAt <= startsAt) {
      throw new BadRequestException('Camp end time must be after start time.');
    }
  }

  private defaultNeededBy(urgency: CreateBloodRequestDto['urgency']) {
    const hours = urgency === 'CRITICAL' ? 12 : urgency === 'HIGH' ? 24 : 72;
    return new Date(Date.now() + hours * 60 * 60 * 1000);
  }

  private toInventorySummary(inventory: Array<{ unitsAvailable: number; unitsReserved: number }>) {
    return {
      totalUnitsAvailable: inventory.reduce((sum, item) => sum + item.unitsAvailable, 0),
      totalUnitsReserved: inventory.reduce((sum, item) => sum + item.unitsReserved, 0),
      bloodGroupsTracked: inventory.length
    };
  }

  private toInventoryDto(item: {
    id: string;
    bloodGroup: BloodGroup;
    unitsAvailable: number;
    unitsReserved: number;
    minimumThreshold: number;
    updatedAt: Date;
  }) {
    return {
      id: item.id,
      bloodGroup: item.bloodGroup,
      unitsAvailable: item.unitsAvailable,
      unitsReserved: item.unitsReserved,
      criticalThreshold: item.minimumThreshold,
      status: item.unitsAvailable <= item.minimumThreshold ? 'LOW_STOCK' : 'OK',
      updatedAt: item.updatedAt
    };
  }

  private toResponseDto(response: {
    id: string;
    status: ResponseStatus;
    respondedAt: Date;
    donorProfile: { bloodGroup: BloodGroup; user: { name: string } };
    bloodRequest: { bloodGroup: BloodGroup; reason: string };
  }) {
    return {
      id: response.id,
      donorName: response.donorProfile.user.name,
      donorBloodGroup: response.donorProfile.bloodGroup,
      requestBloodGroup: response.bloodRequest.bloodGroup,
      responseStatus: RESPONSE_STATUS_LABEL[response.status],
      responseDate: response.respondedAt,
      description: response.bloodRequest.reason
    };
  }

  private toCampDto(camp: {
    id: string;
    name: string;
    description: string | null;
    address: string;
    startsAt: Date;
    endsAt: Date;
    isActive: boolean;
  }) {
    return {
      id: camp.id,
      title: camp.name,
      venue: camp.address,
      description: camp.description,
      startsAt: camp.startsAt,
      endsAt: camp.endsAt,
      isActive: camp.isActive
    };
  }
}
