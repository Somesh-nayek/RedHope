import { ApiProperty } from '@nestjs/swagger';
import { UserRole, UserStatus } from '@red-hope/db';
import { Exclude } from 'class-transformer';

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    status: UserStatus;
    hospitalApproved?: boolean;
  };
}

export class CurrentUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  role: UserRole;

  @ApiProperty()
  status: UserStatus;

  @ApiProperty({ required: false })
  hospitalApproved?: boolean;

  @ApiProperty()
  createdAt: Date;

  @Exclude()
  passwordHash?: string;

  @Exclude()
  hashedRefreshToken?: string;
}
