import { Injectable, UnauthorizedException } from '@nestjs/common';
import { type ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { type JwtPayload } from '../auth.types';
import { type UserStore } from '../user.store';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly config: ConfigService,
    private readonly userStore: UserStore,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.secret') ?? '',
    });
  }

  async validate(payload: JwtPayload) {
    const user = this.userStore.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return { id: payload.sub, email: payload.email, name: payload.name, role: payload.role };
  }
}
