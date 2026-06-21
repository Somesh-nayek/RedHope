import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { UserRole, UserStatus, prisma } from '@red-hope/db';
import { ExtractJwt, Strategy } from 'passport-jwt';
import "dotenv/config";
export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET')
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { status: true }
    });

    if (!user || user.status === UserStatus.SUSPENDED || user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException('User account is not active');
    }

    return payload;
  }
}
