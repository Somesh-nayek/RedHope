import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BloodGroup, RequestStatus, RequestUrgency } from '@red-hope/db';
import {
  IsDateString,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min
} from 'class-validator';

export class UpsertInventoryDto {
  @ApiProperty({ enum: BloodGroup })
  @IsEnum(BloodGroup)
  bloodGroup: BloodGroup;

  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  unitsAvailable: number;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  unitsReserved?: number;

  @ApiPropertyOptional({ minimum: 0, default: 5 })
  @IsOptional()
  @IsInt()
  @Min(0)
  criticalThreshold?: number;
}

export class UpdateInventoryDto {
  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  unitsAvailable?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  unitsReserved?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  criticalThreshold?: number;
}

export class CreateBloodRequestDto {
  @ApiProperty({ enum: BloodGroup })
  @IsEnum(BloodGroup)
  bloodGroup: BloodGroup;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  unitsRequired: number;

  @ApiProperty({ enum: RequestUrgency })
  @IsEnum(RequestUrgency)
  urgency: RequestUrgency;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  neededBy?: string;
}

export class UpdateBloodRequestDto {
  @ApiPropertyOptional({ enum: BloodGroup })
  @IsOptional()
  @IsEnum(BloodGroup)
  bloodGroup?: BloodGroup;

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  unitsRequired?: number;

  @ApiPropertyOptional({ enum: RequestUrgency })
  @IsOptional()
  @IsEnum(RequestUrgency)
  urgency?: RequestUrgency;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @ApiPropertyOptional({ enum: [RequestStatus.OPEN, RequestStatus.FULFILLED, RequestStatus.CANCELLED] })
  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;
}

export class UpdateResponseDto {
  @ApiProperty({ enum: ['VERIFIED', 'REJECTED'] })
  @IsIn(['VERIFIED', 'REJECTED'])
  status: 'VERIFIED' | 'REJECTED';
}

export class CreateCampDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  venue: string;

  @ApiProperty()
  @IsDateString()
  startsAt: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateCampDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  venue?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
