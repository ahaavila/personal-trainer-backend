import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AlunoLevel, AlunoObjective, Role } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { EmailService } from '../email/email.service.js';
import { comparePassword, hashPassword } from './password.js';
import type { UpdateProfileDto } from './update-profile.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async login(email: string, password: string, rememberMe = false) {
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

    const expiresIn = rememberMe ? '30d' : '1d';
    const token = await this.jwtService.signAsync(
      {
        sub: user.id,
        role: user.role,
      },
      { expiresIn },
    );

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

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async createPasswordResetToken(
    userId: number,
  ): Promise<{ rawToken: string; expiresAt: Date }> {
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });

    await this.prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return { rawToken, expiresAt };
  }

  async forgotPassword(
    email: string,
  ): Promise<{ message: string; rawToken?: string }> {
    const genericResponse = {
      message:
        'Se o e-mail estiver registado, enviámos instruções para redefinir a sua senha.',
    };

    if (typeof email !== 'string' || !email.trim()) {
      return genericResponse;
    }

    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user) {
      return genericResponse;
    }

    const { rawToken } = await this.createPasswordResetToken(user.id);

    await this.emailService.sendPasswordResetEmail(
      user.email,
      user.name,
      rawToken,
    );

    return {
      ...genericResponse,
      rawToken,
    };
  }

  async verifyResetToken(token: string) {
    if (!token || typeof token !== 'string') {
      throw new BadRequestException('Token de recuperação inválido ou expirado.');
    }

    const tokenHash = this.hashToken(token);
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!record) {
      throw new BadRequestException('Token de recuperação inválido ou expirado.');
    }

    if (record.usedAt !== null) {
      throw new BadRequestException('Token de recuperação já utilizado.');
    }

    if (record.expiresAt < new Date()) {
      throw new BadRequestException('Token de recuperação expirado.');
    }

    return record;
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      throw new BadRequestException(
        'A senha deve ter no mínimo 6 caracteres.',
      );
    }

    const tokenRecord = await this.verifyResetToken(token);
    const passwordHash = await hashPassword(newPassword);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: tokenRecord.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.updateMany({
        where: { userId: tokenRecord.userId, usedAt: null },
        data: { usedAt: new Date() },
      }),
    ]);

    return { message: 'Senha redefinida com sucesso.' };
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        objective: true,
        level: true,
        status: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Utilizador não encontrado.');
    }

    if (user.role === 'aluno') {
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl ?? null,
        objective: user.objective ?? 'não informado',
        level: user.level ?? 'não informado',
        status: user.status ?? 'ativo',
      };
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl ?? null,
    };
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new NotFoundException('Utilizador não encontrado.');
    }

    const data: {
      name?: string;
      avatarUrl?: string | null;
      objective?: AlunoObjective;
      level?: AlunoLevel;
    } = {};

    if (dto.name !== undefined) {
      const trimmed = typeof dto.name === 'string' ? dto.name.trim() : '';
      if (trimmed.length < 2) {
        throw new BadRequestException('O nome deve ter no mínimo 2 caracteres.');
      }
      data.name = trimmed;
    }

    if (dto.avatarUrl !== undefined) {
      data.avatarUrl = dto.avatarUrl;
    }

    if (user.role === 'aluno') {
      if (dto.objective !== undefined) {
        data.objective = dto.objective;
      }
      if (dto.level !== undefined) {
        data.level = dto.level;
      }
    }

    if (Object.keys(data).length > 0) {
      await this.prisma.user.update({
        where: { id: userId },
        data,
      });
    }

    return this.getProfile(userId);
  }

  async changePassword(
    userId: number,
    currentPassword?: string,
    newPassword?: string,
  ): Promise<{ message: string }> {
    if (!currentPassword || typeof currentPassword !== 'string') {
      throw new BadRequestException('A senha atual é obrigatória.');
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      throw new BadRequestException('A nova senha deve ter no mínimo 6 caracteres.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      throw new NotFoundException('Utilizador não encontrado.');
    }

    const isValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new BadRequestException('A senha atual está incorreta.');
    }

    const passwordHash = await hashPassword(newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { message: 'Senha alterada com sucesso.' };
  }
}