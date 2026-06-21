import { Injectable, NotFoundException } from '@nestjs/common';
import { Notification, ResponseStatus, UserStatus, prisma } from '@red-hope/db';
import { NoopEmailService } from './email.service';

interface ListNotificationsOptions {
  page?: number | string;
  limit?: number | string;
}

@Injectable()
export class NotificationService {
  constructor(private readonly emailService: NoopEmailService) {}

  async listForUser(userId: string, options: ListNotificationsOptions = {}) {
    const page = this.toPositiveInt(options.page, 1);
    const limit = Math.min(this.toPositiveInt(options.limit, 20), 50);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: [{ isRead: 'asc' }, { sentAt: 'desc' }],
        skip,
        take: limit
      }),
      prisma.notification.count({ where: { userId } })
    ]);

    return {
      items: items.map((notification) => this.toNotificationDto(notification)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async unreadCount(userId: string) {
    const count = await prisma.notification.count({ where: { userId, isRead: false } });
    return { count };
  }

  async markRead(userId: string, notificationId: string) {
    const result = await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true }
    });

    if (result.count === 0) throw new NotFoundException('Notification not found.');
    return { message: 'Notification marked as read.' };
  }

  async markAllRead(userId: string) {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });

    return { message: 'Notifications marked as read.', count: result.count };
  }

  async deleteForUser(userId: string, notificationId: string) {
    const result = await prisma.notification.deleteMany({
      where: { id: notificationId, userId }
    });

    if (result.count === 0) throw new NotFoundException('Notification not found.');
    return { message: 'Notification deleted.' };
  }

  async notifyMatchingDonorsForBloodRequest(requestId: string) {
    const request = await prisma.bloodRequest.findUnique({
      where: { id: requestId },
      include: { requestedByHospital: { select: { hospitalName: true, city: true, state: true } } }
    });
    if (!request) return;

    const donors = await prisma.donorProfile.findMany({
      where: {
        bloodGroup: request.bloodGroup,
        user: { status: UserStatus.ACTIVE }
      },
      select: { userId: true }
    });

    await this.createMany(
      donors.map((donor) => ({
        userId: donor.userId,
        bloodRequestId: request.id,
        title: `${request.bloodGroup} blood request`,
        message: `${request.requestedByHospital.hospitalName} needs ${request.unitsRequired} unit(s) in ${request.locationCity}, ${request.locationState}.`
      }))
    );
  }

  async notifyHospitalApproved(userId: string) {
    await this.createOne({
      userId,
      title: 'Hospital approved',
      message: 'Your hospital account has been approved. Hospital features are now available.'
    });
  }

  async notifyDonationResponseVerified(responseId: string) {
    const response = await prisma.donationResponse.findUnique({
      where: { id: responseId },
      include: {
        donorProfile: { select: { userId: true } },
        bloodRequest: {
          include: { requestedByHospital: { select: { hospitalName: true } } }
        }
      }
    });
    if (!response) return;

    await this.createOne({
      userId: response.donorProfile.userId,
      bloodRequestId: response.bloodRequestId,
      title: 'Donation verified',
      message: `${response.bloodRequest.requestedByHospital.hospitalName} verified your donation response. Thank you for donating.`
    });
  }

  async notifyDonorsForCamp(campId: string) {
    const camp = await prisma.bloodDonationCamp.findUnique({
      where: { id: campId },
      include: { organizedByHospital: { select: { hospitalName: true } } }
    });
    if (!camp) return;

    const donors = await prisma.donorProfile.findMany({
      where: {
        city: camp.city,
        state: camp.state,
        user: { status: UserStatus.ACTIVE }
      },
      select: { userId: true }
    });

    await this.createMany(
      donors.map((donor) => ({
        userId: donor.userId,
        campId: camp.id,
        title: 'New donation camp',
        message: `${camp.organizedByHospital.hospitalName} scheduled ${camp.name} in ${camp.city}, ${camp.state}.`
      }))
    );
  }

  async notifyBloodRequestFulfilled(requestId: string) {
    const request = await prisma.bloodRequest.findUnique({
      where: { id: requestId },
      include: {
        requestedByHospital: { select: { hospitalName: true } },
        responses: {
          where: { status: { not: ResponseStatus.REJECTED } },
          include: { donorProfile: { select: { userId: true } } }
        }
      }
    });
    if (!request) return;

    const userIds = Array.from(new Set(request.responses.map((response) => response.donorProfile.userId)));
    await this.createMany(
      userIds.map((userId) => ({
        userId,
        bloodRequestId: request.id,
        title: 'Blood request fulfilled',
        message: `${request.requestedByHospital.hospitalName}'s ${request.bloodGroup} request has been fulfilled.`
      }))
    );
  }

  async notifyUserSuspended(userId: string) {
    await this.createOne({
      userId,
      title: 'Account suspended',
      message: 'Your account has been suspended by an administrator.'
    });
  }

  private async createOne(data: {
    userId: string;
    title: string;
    message: string;
    bloodRequestId?: string;
    campId?: string;
  }) {
    await prisma.notification.create({ data });
    await this.emailService.send({ to: data.userId, subject: data.title, body: data.message });
  }

  private async createMany(
    notifications: Array<{
      userId: string;
      title: string;
      message: string;
      bloodRequestId?: string;
      campId?: string;
    }>
  ) {
    if (notifications.length === 0) return;
    await prisma.notification.createMany({ data: notifications });
  }

  private toPositiveInt(value: number | string | undefined, fallback: number) {
    const parsed = Number(value ?? fallback);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
  }

  private toNotificationDto(notification: Notification) {
    return {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      isRead: notification.isRead,
      sentAt: notification.sentAt,
      createdAt: notification.createdAt,
      bloodRequestId: notification.bloodRequestId,
      campId: notification.campId
    };
  }
}
