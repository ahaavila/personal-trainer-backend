import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { AlunoObjective, AlunoStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthService } from '../auth/auth.service.js';
import { EmailService } from '../email/email.service.js';
import { hashPassword } from '../auth/password.js';
import type {
  AlunoListingDto,
  AlunoListingQuery,
  CreateAlunoDto,
} from './aluno-listing.dto.js';
import type { UpdateAlunoStatusDto } from './update-aluno-status.dto.js';

const OBJECTIVES = Object.values(AlunoObjective);
const STATUSES = Object.values(AlunoStatus);
export const BASIC_PLAN_MAX_ACTIVE_STUDENTS = 5;

@Injectable()
export class AlunosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly emailService: EmailService,
  ) {}

  async list(personalId: number, query: AlunoListingQuery): Promise<AlunoListingDto[]> {
    const objective = this.validateEnumFilter(query.objective, OBJECTIVES, 'objective');
    const status = this.validateEnumFilter(query.status, STATUSES, 'status');
    const search = query.search?.trim();

    const alunos = await this.prisma.user.findMany({
      where: {
        role: 'aluno',
        personalId,
        ...(objective ? { objective } : {}),
        ...(status ? { status } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        objective: true,
        level: true,
        status: true,
        assignedFichas: {
          select: {
            treinos: {
              where: { completedAt: { not: null } },
              orderBy: { completedAt: 'desc' },
              take: 1,
              select: { name: true, completedAt: true },
            },
          },
        },
      },
    });

    return alunos.map((aluno) => ({
      id: aluno.id,
      name: aluno.name,
      email: aluno.email,
      objective: aluno.objective ?? 'não informado',
      level: aluno.level ?? 'não informado',
      status: aluno.status ?? 'não informado',
      latestWorkout: this.latestWorkout(aluno.assignedFichas),
    }));
  }

  async create(
    personalId: number,
    input: CreateAlunoDto,
    personalName?: string,
  ): Promise<AlunoListingDto> {
    const data = this.validateCreateInput(input);

    const trainer = await this.prisma.user.findUnique({
      where: { id: personalId },
      select: { name: true, plan: true, role: true },
    });

    if (!trainer || trainer.role !== 'personal') {
      throw new ForbiddenException('Apenas personal trainers podem criar alunos.');
    }

    if (trainer.plan === 'basic') {
      const activeCount = await this.prisma.user.count({
        where: { personalId, role: 'aluno', status: 'ativo' },
      });

      if (activeCount >= BASIC_PLAN_MAX_ACTIVE_STUDENTS) {
        throw new ForbiddenException(
          'Atingiu o limite de 5 alunos ativos do Plano Básico. Faça o upgrade para o Plano PRO.',
        );
      }
    }

    const randomSecret = randomBytes(32).toString('hex');
    const passwordHash = await hashPassword(randomSecret);

    try {
      const aluno = await this.prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          passwordHash,
          role: 'aluno',
          personalId,
          objective: data.objective,
          level: data.level,
          status: 'ativo',
        },
        select: {
          id: true,
          name: true,
          email: true,
          objective: true,
          level: true,
          status: true,
        },
      });

      const personal = personalName || trainer.name || 'Personal Trainer';

      const { rawToken } = await this.authService.createPasswordResetToken(
        aluno.id,
      );

      try {
        await this.emailService.sendStudentInviteEmail(
          aluno.email,
          aluno.name,
          personal,
          rawToken,
        );
      } catch {
        // Non-blocking email dispatch failure
      }

      return {
        ...aluno,
        objective: aluno.objective ?? 'não informado',
        level: aluno.level ?? 'não informado',
        status: aluno.status ?? 'não informado',
        latestWorkout: null,
      };
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email is already in use');
      }

      throw error;
    }
  }

  async updateStatus(
    personalId: number,
    alunoId: number,
    dto: UpdateAlunoStatusDto,
  ): Promise<AlunoListingDto> {
    const aluno = await this.prisma.user.findFirst({
      where: { id: alunoId, personalId, role: 'aluno' },
      include: {
        assignedFichas: {
          select: {
            treinos: {
              where: { completedAt: { not: null } },
              orderBy: { completedAt: 'desc' },
              take: 1,
              select: { name: true, completedAt: true },
            },
          },
        },
      },
    });

    if (!aluno) {
      throw new NotFoundException('Aluno não encontrado para este personal.');
    }

    if (dto.status === 'ativo' && aluno.status !== 'ativo') {
      const trainer = await this.prisma.user.findUnique({
        where: { id: personalId },
        select: { plan: true },
      });

      if (trainer?.plan === 'basic') {
        const activeCount = await this.prisma.user.count({
          where: { personalId, role: 'aluno', status: 'ativo' },
        });

        if (activeCount >= BASIC_PLAN_MAX_ACTIVE_STUDENTS) {
          throw new ForbiddenException(
            'Atingiu o limite de 5 alunos ativos do Plano Básico. Faça o upgrade para o Plano PRO.',
          );
        }
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: alunoId },
      data: { status: dto.status },
      select: {
        id: true,
        name: true,
        email: true,
        objective: true,
        level: true,
        status: true,
      },
    });

    return {
      ...updated,
      objective: updated.objective ?? 'não informado',
      level: updated.level ?? 'não informado',
      status: updated.status ?? 'não informado',
      latestWorkout: this.latestWorkout(aluno.assignedFichas),
    };
  }

  private validateCreateInput(input: CreateAlunoDto) {
    if (
      typeof input.name !== 'string' ||
      input.name.trim().length < 2 ||
      typeof input.email !== 'string' ||
      !/^\S+@\S+\.\S+$/.test(input.email.trim()) ||
      (input as Record<string, unknown>).password !== undefined
    ) {
      throw new BadRequestException('Invalid aluno data');
    }

    const objective = this.validateEnumFilter(
      typeof input.objective === 'string' ? input.objective : undefined,
      OBJECTIVES,
      'objective',
    );
    const level = this.validateEnumFilter(
      typeof input.level === 'string' ? input.level : undefined,
      ['iniciante', 'intermediario', 'avancado'],
      'level',
    );

    if (!objective || !level) {
      throw new BadRequestException('Invalid aluno data');
    }

    return {
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      objective,
      level: level as 'iniciante' | 'intermediario' | 'avancado',
    };
  }

  private validateEnumFilter<T extends string>(
    value: string | undefined,
    allowed: readonly T[],
    name: string,
  ): T | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (!allowed.includes(value as T)) {
      throw new BadRequestException(`Invalid ${name} filter`);
    }

    return value as T;
  }

  private latestWorkout(
    fichas: Array<{ treinos: Array<{ name: string; completedAt: Date | null }> }>,
  ): AlunoListingDto['latestWorkout'] {
    const workouts = fichas.flatMap(({ treinos }) => treinos);
    const latest = workouts[0];
    return latest?.completedAt
      ? { name: latest.name, completedAt: latest.completedAt }
      : null;
  }
}