import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthResponseDto, CurrentUserDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDonorDto } from './dto/register-donor.dto';
import { RegisterHospitalDto } from './dto/register-hospital.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import { AllowUnapprovedHospital } from './decorators/allow-unapproved-hospital.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { JwtPayload } from './strategies/jwt.strategy';
import { RefreshJwtPayload } from './strategies/refresh-token.strategy';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register/donor')
  @AllowUnapprovedHospital()
  @ApiOperation({ summary: 'Register a new donor' })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  async registerDonor(@Body() dto: RegisterDonorDto): Promise<AuthResponseDto> {
    return this.authService.registerDonor(dto);
  }

  @Post('register/hospital')
  @AllowUnapprovedHospital()
  @ApiOperation({ summary: 'Register a new hospital' })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  async registerHospital(@Body() dto: RegisterHospitalDto): Promise<AuthResponseDto> {
    return this.authService.registerHospital(dto);
  }

  @Post('login')
  @AllowUnapprovedHospital()
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @AllowUnapprovedHospital()
  @UseGuards(RefreshTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async refresh(
    @CurrentUser() user: RefreshJwtPayload & { refreshToken: string }
  ): Promise<AuthResponseDto> {
    return this.authService.refresh(user.refreshToken, user.sub);
  }

  @Post('logout')
  @AllowUnapprovedHospital()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(@CurrentUser() user: JwtPayload): Promise<{ message: string }> {
    await this.authService.logout(user.sub);
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @AllowUnapprovedHospital()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({ status: 200, type: CurrentUserDto })
  async getCurrentUser(@CurrentUser() user: JwtPayload): Promise<CurrentUserDto> {
    return this.authService.getCurrentUser(user.sub);
  }
}
