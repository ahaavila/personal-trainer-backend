import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import { comparePassword } from './password.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !(await comparePassword(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = await this.jwtService.signAsync({
      sub: user.id,
      role: user.role,
    });

    return { token, role: user.role, name: user.name };
  }

  async getSession(token: string) {
    let payload: { sub: number; role: Role };

    try {
      payload = await this.jwtService.verifyAsync<{ sub: number; role: Role }>(
        token,
      );
    } catch {
      throw new UnauthorizedException('Invalid or expired session');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { role: true, name: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    return user;
  }

  getTokenExpiration(token: string): Date | undefined {
    const payload = this.jwtService.decode(token);

    if (
      typeof payload !== 'object' ||
      payload === null ||
      !('exp' in payload) ||
      typeof payload.exp !== 'number'
    ) {
      return undefined;
    }

    return new Date(payload.exp * 1000);
  }
}