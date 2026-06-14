import { applyDecorators, UseGuards } from '@nestjs/common';
import { UserRole } from '@red-hope/db';
import { HospitalApprovalGuard } from '../guards/hospital-approval.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from './roles.decorator';

/**
 * Apply to every hospital business controller or handler.
 * Auth endpoints intentionally do not use this decorator.
 */
export function HospitalFeature() {
  return applyDecorators(
    Roles(UserRole.HOSPITAL),
    UseGuards(JwtAuthGuard, RolesGuard, HospitalApprovalGuard)
  );
}
