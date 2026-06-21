import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@red-hope/db';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { AdminService } from './admin.service';
import { CreateAdminCampDto, UpdateAdminCampDto, UpdateUserStatusDto } from './dto/admin.dto';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard' })
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('users')
  @ApiOperation({ summary: 'List users' })
  getUsers() {
    return this.adminService.getUsers();
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user details' })
  getUser(@Param('id') id: string) {
    return this.adminService.getUser(id);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update user status' })
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserStatusDto) {
    return this.adminService.updateUser(id, dto);
  }

  @Get('hospitals')
  @ApiOperation({ summary: 'List hospitals' })
  getHospitals() {
    return this.adminService.getHospitals();
  }

  @Get('hospitals/:id')
  @ApiOperation({ summary: 'Get hospital details' })
  getHospital(@Param('id') id: string) {
    return this.adminService.getHospital(id);
  }

  @Patch('hospitals/:id/approve')
  @ApiOperation({ summary: 'Approve hospital' })
  approveHospital(@Param('id') id: string) {
    return this.adminService.approveHospital(id);
  }

  @Patch('hospitals/:id/reject')
  @ApiOperation({ summary: 'Reject hospital' })
  rejectHospital(@Param('id') id: string) {
    return this.adminService.rejectHospital(id);
  }

  @Get('camps')
  @ApiOperation({ summary: 'List donation camps' })
  getCamps() {
    return this.adminService.getCamps();
  }

  @Post('camps')
  @ApiOperation({ summary: 'Create donation camp' })
  createCamp(@Body() dto: CreateAdminCampDto) {
    return this.adminService.createCamp(dto);
  }

  @Patch('camps/:id')
  @ApiOperation({ summary: 'Update donation camp' })
  updateCamp(@Param('id') id: string, @Body() dto: UpdateAdminCampDto) {
    return this.adminService.updateCamp(id, dto);
  }

  @Delete('camps/:id')
  @ApiOperation({ summary: 'Deactivate donation camp' })
  deleteCamp(@Param('id') id: string) {
    return this.adminService.deleteCamp(id);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get system analytics' })
  getAnalytics() {
    return this.adminService.getAnalytics();
  }
}
