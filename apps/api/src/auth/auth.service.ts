import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, UserRole, UserStatus, prisma } from '@red-hope/db';
import * as bcrypt from 'bcrypt';
import type { SignOptions } from 'jsonwebtoken';
import { CurrentUserDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDonorDto } from './dto/register-donor.dto';
import { RegisterHospitalDto } from './dto/register-hospital.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import "dotenv/config";

type UserWithHospitalProfile = Prisma.UserGetPayload<{
  include: { hospitalProfile: true };
}>;

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService
  ) {}

  async registerDonor(
    dto: RegisterDonorDto
  ): Promise<{ accessToken: string; refreshToken: string; user: CurrentUserDto }> {
    const existingUser = await prisma.user.findUnique({ where: { email: dto.email } });
    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    const hashedPassword = await this.hashPassword(dto.password);

    const user = await prisma.user.create({
      data: {
        email: dto.email,
        phoneNumber: dto.phone,
        name: dto.name,
        passwordHash: hashedPassword,
        role: UserRole.DONOR,
        donorProfile: {
          create: {
            bloodGroup: dto.bloodGroup,
            city: dto.city,
            state: dto.state,
            address: dto.address,
            dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null
          }
        }
      },
      include: { hospitalProfile: true }
    });

    const { accessToken, refreshToken } = this.generateTokens(
      user.id,
      user.email,
      user.role
    );

    const hashedRefreshToken = await this.hashPassword(refreshToken);
    await prisma.user.update({
      where: { id: user.id },
      data: { hashedRefreshToken }
    });

    return {
      accessToken,
      refreshToken,
      user: this.toCurrentUserDto(user)
    };
  }

  async registerHospital(
    dto: RegisterHospitalDto
  ): Promise<{ accessToken: string; refreshToken: string; user: CurrentUserDto }> {
    const existingUser = await prisma.user.findUnique({ where: { email: dto.email } });
    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    const hashedPassword = await this.hashPassword(dto.password);

    const user = await prisma.user.create({
      data: {
        email: dto.email,
        phoneNumber: dto.phone,
        name: dto.hospitalName,
        passwordHash: hashedPassword,
        role: UserRole.HOSPITAL,
        hospitalProfile: {
          create: {
            hospitalName: dto.hospitalName,
            licenseNumber: `HC-${Date.now()}`,
            contactNumber: dto.phone,
            address: dto.address,
            city: dto.city,
            state: dto.state,
            approved: false
          }
        }
      },
      include: { hospitalProfile: true }
    });

    const { accessToken, refreshToken } = this.generateTokens(
      user.id,
      user.email,
      user.role
    );

    const hashedRefreshToken = await this.hashPassword(refreshToken);
    await prisma.user.update({
      where: { id: user.id },
      data: { hashedRefreshToken }
    });

    return {
      accessToken,
      refreshToken,
      user: this.toCurrentUserDto(user)
    };
  }

  async login(dto: LoginDto): Promise<{ accessToken: string; refreshToken: string; user: CurrentUserDto }> {
    const user = await prisma.user.findUnique({
      where: { email: dto.email },
      include: { hospitalProfile: true }
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    this.assertUserCanAuthenticate(user.status);

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const { accessToken, refreshToken } = this.generateTokens(
      user.id,
      user.email,
      user.role
    );

    const hashedRefreshToken = await this.hashPassword(refreshToken);
    await prisma.user.update({
      where: { id: user.id },
      data: { hashedRefreshToken }
    });

    return {
      accessToken,
      refreshToken,
      user: this.toCurrentUserDto(user)
    };
  }

  async refresh(
    refreshToken: string,
    userId: string
  ): Promise<{ accessToken: string; refreshToken: string; user: CurrentUserDto }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { hospitalProfile: true }
    });

    if (!user || !user.hashedRefreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    this.assertUserCanAuthenticate(user.status);

    const isTokenValid = await bcrypt.compare(refreshToken, user.hashedRefreshToken);
    if (!isTokenValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(
      user.id,
      user.email,
      user.role
    );

    const hashedRefreshToken = await this.hashPassword(newRefreshToken);
    await prisma.user.update({
      where: { id: user.id },
      data: { hashedRefreshToken }
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: this.toCurrentUserDto(user)
    };
  }

  async logout(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken: null }
    });
  }

  async getCurrentUser(userId: string): Promise<CurrentUserDto> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { hospitalProfile: true }
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    this.assertUserCanAuthenticate(user.status);

    return this.toCurrentUserDto(user);
  }

  private assertUserCanAuthenticate(status: UserStatus): void {
    if (status === UserStatus.SUSPENDED || status === UserStatus.INACTIVE) {
      throw new UnauthorizedException('User account is not active');
    }
  }

  private generateTokens(
    userId: string,
    email: string,
    role: UserRole
  ): { accessToken: string; refreshToken: string } {
    const payload: JwtPayload = {
      sub: userId,
      email,
      role
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get<SignOptions['expiresIn']>('JWT_ACCESS_EXPIRES_IN', '15m')
    });

    const refreshToken = this.jwtService.sign(
      { sub: userId },
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<SignOptions['expiresIn']>('JWT_REFRESH_EXPIRES_IN', '7d')
      }
    );

    return { accessToken, refreshToken };
  }

  private async hashPassword(password: string): Promise<string> {
    const rounds = this.config.get<number>('BCRYPT_ROUNDS', 10);
    return bcrypt.hash(password, rounds);
  }

  private toCurrentUserDto(user: UserWithHospitalProfile): CurrentUserDto {
    const dto: CurrentUserDto = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt
    };

    if (user.role === UserRole.HOSPITAL) {
      dto.hospitalApproved = user.hospitalProfile?.approved ?? false;
    }

    return dto;
  }
}
