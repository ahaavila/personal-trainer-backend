import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { AlunoObjective, AlunoStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { hashPassword } from '../auth/password.js';
import type {
  AlunoListingDto,
  AlunoListingQuery,
  CreateAlunoDto,
} from './aluno-listing.dto.js';

const OBJECTIVES = Object.values(AlunoObjective);
const STATUSES = Object.values(AlunoStatus);

@Injectable()
export class AlunosService {
  constructor(private readonly prisma: PrismaService) {}

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
      name: aluno.name,
      email: aluno.email,
      objective: aluno.objective ?? 'não informado',
      level: aluno.level ?? 'não informado',
      status: aluno.status ?? 'não informado',
      latestWorkout: this.latestWorkout(aluno.assignedFichas),
    }));
  }

  async create(personalId: number, input: CreateAlunoDto): Promise<AlunoListingDto> {
    const data = this.validateCreateInput(input);

    try {
      const aluno = await this.prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          passwordHash: await hashPassword(data.password),
          role: 'aluno',
          personalId,
          objective: data.objective,
          level: data.level,
          status: 'ativo',
        },
        select: {
          name: true,
          email: true,
          objective: true,
          level: true,
          status: true,
        },
      });

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

  private validateCreateInput(input: CreateAlunoDto) {
    if (
      typeof input.name !== 'string' ||
      input.name.trim().length < 2 ||
      typeof input.email !== 'string' ||
      !/^\S+@\S+\.\S+$/.test(input.email.trim()) ||
      typeof input.password !== 'string' ||
      input.password.length < 8
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
      Object.values(['iniciante', 'intermediario', 'avancado']),
      'level',
    );

    if (!objective || !level) {
      throw new BadRequestException('Invalid aluno data');
    }

    return {
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      password: input.password,
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