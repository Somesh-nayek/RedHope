import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole, prisma } from '@red-hope/db';
import type { Request } from 'express';
import { JwtPayload } from '../strategies/jwt.strategy';
import { ALLOW_UNAPPROVED_HOSPITAL_KEY } from '../decorators/allow-unapproved-hospital.decorator';

type AuthenticatedRequest = Request & { user?: JwtPayload };

/**
 * Guard to enforce hospital approval requirement.
 * Blocks hospital business features until approved = true.
 * Allows: login, logout, refresh, auth/me
 */
@Injectable()
export class HospitalApprovalGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const allowUnapprovedHospital = this.reflector.getAllAndOverride<boolean>(
      ALLOW_UNAPPROVED_HOSPITAL_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (allowUnapprovedHospital) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user || user.role !== UserRole.HOSPITAL) {
      return true;
    }

    const hospitalProfile = await prisma.hospitalProfile.findUnique({
      where: { userId: user.sub }
    });

    if (!hospitalProfile) {
      throw new ForbiddenException('Hospital profile not found');
    }

    if (!hospitalProfile.approved) {
      throw new ForbiddenException('Hospital account is awaiting admin approval.');
    }

    return true;
  }
}
