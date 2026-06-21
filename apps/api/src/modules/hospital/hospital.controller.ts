import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@red-hope/db';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { HospitalApprovalGuard } from '../../auth/guards/hospital-approval.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { JwtPayload } from '../../auth/strategies/jwt.strategy';
import {
  CreateBloodRequestDto,
  CreateCampDto,
  UpdateBloodRequestDto,
  UpdateCampDto,
  UpdateInventoryDto,
  UpdateResponseDto,
  UpsertInventoryDto
} from './dto/hospital.dto';
import { HospitalService } from './hospital.service';

@ApiTags('hospital')
@ApiBearerAuth()
@Controller('hospital')
@UseGuards(JwtAuthGuard, RolesGuard, HospitalApprovalGuard)
@Roles(UserRole.HOSPITAL)
export class HospitalController {
  constructor(private readonly hospitalService: HospitalService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get hospital dashboard' })
  getDashboard(@CurrentUser() user: JwtPayload) {
    return this.hospitalService.getDashboard(user.sub);
  }

  @Get('inventory')
  @ApiOperation({ summary: 'List hospital blood inventory' })
  getInventory(@CurrentUser() user: JwtPayload) {
    return this.hospitalService.getInventory(user.sub);
  }

  @Post('inventory')
  @ApiOperation({ summary: 'Create hospital blood inventory record' })
  createInventory(@CurrentUser() user: JwtPayload, @Body() dto: UpsertInventoryDto) {
    return this.hospitalService.createInventory(user.sub, dto);
  }

  @Patch('inventory/:id')
  @ApiOperation({ summary: 'Update hospital blood inventory record' })
  updateInventory(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateInventoryDto
  ) {
    return this.hospitalService.updateInventory(user.sub, id, dto);
  }

  @Delete('inventory/:id')
  @ApiOperation({ summary: 'Delete hospital blood inventory record' })
  deleteInventory(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.hospitalService.deleteInventory(user.sub, id);
  }

  @Get('requests')
  @ApiOperation({ summary: 'List hospital blood requests' })
  getRequests(@CurrentUser() user: JwtPayload) {
    return this.hospitalService.getRequests(user.sub);
  }

  @Post('requests')
  @ApiOperation({ summary: 'Create hospital blood request' })
  createRequest(@CurrentUser() user: JwtPayload, @Body() dto: CreateBloodRequestDto) {
    return this.hospitalService.createRequest(user.sub, dto);
  }

  @Patch('requests/:id')
  @ApiOperation({ summary: 'Update hospital blood request' })
  updateRequest(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateBloodRequestDto
  ) {
    return this.hospitalService.updateRequest(user.sub, id, dto);
  }

  @Delete('requests/:id')
  @ApiOperation({ summary: 'Cancel hospital blood request' })
  deleteRequest(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.hospitalService.deleteRequest(user.sub, id);
  }

  @Get('requests/:id/responses')
  @ApiOperation({ summary: 'List donor responses for a hospital request' })
  getRequestResponses(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.hospitalService.getRequestResponses(user.sub, id);
  }

  @Patch('responses/:id')
  @ApiOperation({ summary: 'Verify or reject a donor response' })
  updateResponse(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateResponseDto
  ) {
    return this.hospitalService.updateResponse(user.sub, id, dto);
  }

  @Get('camps')
  @ApiOperation({ summary: 'List hospital donation camps' })
  getCamps(@CurrentUser() user: JwtPayload) {
    return this.hospitalService.getCamps(user.sub);
  }

  @Post('camps')
  @ApiOperation({ summary: 'Create hospital donation camp' })
  createCamp(@CurrentUser() user: JwtPayload, @Body() dto: CreateCampDto) {
    return this.hospitalService.createCamp(user.sub, dto);
  }

  @Patch('camps/:id')
  @ApiOperation({ summary: 'Update hospital donation camp' })
  updateCamp(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateCampDto) {
    return this.hospitalService.updateCamp(user.sub, id, dto);
  }

  @Delete('camps/:id')
  @ApiOperation({ summary: 'Deactivate hospital donation camp' })
  deleteCamp(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.hospitalService.deleteCamp(user.sub, id);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get hospital analytics' })
  getAnalytics(@CurrentUser() user: JwtPayload) {
    return this.hospitalService.getAnalytics(user.sub);
  }
}
