import { env } from 'src/common/config/env.config';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { IJwtPayload } from '../jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: env.get<string>('JWT_SECRET', 'dummy-jwt-secret'),
    });
  }

  validate(payload: IJwtPayload) {
    return {
      userId: payload.sub,
      role: payload.role,
      sessionId: payload.sid,
    };
  }
}
