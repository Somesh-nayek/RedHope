import { Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@red-hope/db';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { JwtPayload } from '../../auth/strategies/jwt.strategy';
import { DonorService } from './donor.service';

@ApiTags('donor')
@ApiBearerAuth()
@Controller('donor')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DONOR)
export class DonorController {
  constructor(private readonly donorService: DonorService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get donor dashboard statistics and eligibility' })
  getDashboard(@CurrentUser() user: JwtPayload) {
    return this.donorService.getDashboard(user.sub);
  }

  @Get('requests')
  @ApiOperation({ summary: 'List open blood requests' })
  getRequests() {
    return this.donorService.getRequests();
  }

  @Post('respond/:requestId')
  @ApiOperation({ summary: 'Respond to an open blood request' })
  respond(@CurrentUser() user: JwtPayload, @Param('requestId') requestId: string) {
    return this.donorService.respondToRequest(user.sub, requestId);
  }

  @Get('camps')
  @ApiOperation({ summary: 'List upcoming donation camps' })
  getCamps() {
    return this.donorService.getCamps();
  }

  @Get('history')
  @ApiOperation({ summary: 'Get donor donation history' })
  getHistory(@CurrentUser() user: JwtPayload) {
    return this.donorService.getHistory(user.sub);
  }

  @Get('notifications')
  @ApiOperation({ summary: 'Get donor notifications' })
  getNotifications(@CurrentUser() user: JwtPayload) {
    return this.donorService.getNotifications(user.sub);
  }

  @Patch('notifications/:id/read')
  @ApiOperation({ summary: 'Mark a donor notification as read' })
  markNotificationRead(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.donorService.markNotificationRead(user.sub, id);
  }
}
