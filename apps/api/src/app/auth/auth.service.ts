import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { type ConfigService } from '@nestjs/config';
import { type JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { type RegisterDto, type LoginDto } from './dto/auth.dto';
import { type UserStore } from './user.store';

import type { AuthResponse, JwtPayload } from './auth.types';

@Injectable()
export class AuthService {
  private readonly BCRYPT_ROUNDS = 12;

  constructor(
    private readonly userStore: UserStore,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existing = this.userStore.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.BCRYPT_ROUNDS);
    const role = this.userStore.count() === 0 ? 'admin' : 'user';

    const user = this.userStore.create({
      email: dto.email,
      name: dto.name,
      passwordHash,
      role,
    });

    return this.generateTokens(user.id, user.email, user.name, user.role);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = this.userStore.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user.id, user.email, user.name, user.role);
  }

  private generateTokens(id: string, email: string, name: string, role: string): AuthResponse {
    const expiresIn = this.config.get<string>('jwt.expiresIn') ?? '12h';
    const payload: JwtPayload = { sub: id, email, name, role };
    const accessToken = this.jwtService.sign(payload);
    return { accessToken, expiresIn, user: { id, email, name, role } };
  }
}
