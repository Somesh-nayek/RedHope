import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterHospitalDto {
  @ApiProperty({ example: 'CityCare Hospital' })
  @IsString()
  @IsNotEmpty()
  hospitalName: string;

  @ApiProperty({ example: 'hospital@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: '+911140101010' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: '12 Connaught Place' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: 'Delhi' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'Delhi' })
  @IsString()
  @IsNotEmpty()
  state: string;
}
