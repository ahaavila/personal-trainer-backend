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
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        name: true,
        role: true,
        status: true,
      },
    });

    if (!user || !(await comparePassword(password, user.passwordHash))) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    if (user.role === 'aluno' && user.status !== 'ativo') {
      throw new UnauthorizedException(
        'A sua conta de aluno está inativa. Contacte o seu personal trainer.',
      );
    }

    const token = await this.jwtService.signAsync({
      sub: user.id,
      role: user.role,
    });

    return { token, role: user.role, name: user.name };
  }

  async getSession(token: string) {
    const user = await this.getAuthenticatedUser(token);

    return { role: user.role, name: user.name };
  }

  async getAuthenticatedUser(token: string) {
    let payload: { sub: number; role: Role };

    try {
      payload = await this.jwtService.verifyAsync<{ sub: number; role: Role }>(
        token,
      );
    } catch {
      throw new UnauthorizedException('Sessão inválida ou expirada.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, name: true, status: true },
    });

    if (!user) {
      throw new UnauthorizedException('Sessão inválida ou expirada.');
    }

    if (user.role === 'aluno' && user.status !== 'ativo') {
      throw new UnauthorizedException(
        'A sua conta de aluno está inativa. Contacte o seu personal trainer.',
      );
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