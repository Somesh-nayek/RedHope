import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface RefreshJwtPayload {
  sub: string;
}

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private readonly config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true
    });
  }

  validate(req: Request, payload: RefreshJwtPayload): RefreshJwtPayload & { refreshToken: string } {
    const refreshToken = req.get('authorization')?.replace('Bearer ', '') ?? '';
    return {
      ...payload,
      refreshToken
    };
  }
}
