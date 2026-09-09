import { BadRequestException, Injectable } from '@nestjs/common';
import { AlunoLevel } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  ExercicioListingDto,
  ExercicioListingQuery,
} from './exercicio-listing.dto.js';

const LEVELS = Object.values(AlunoLevel);

@Injectable()
export class ExerciciosService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    personalId: number,
    query: ExercicioListingQuery,
  ): Promise<ExercicioListingDto[]> {
    const level = this.validateLevel(query.level);
    const search = query.search?.trim();
    const muscleGroup = query.muscleGroup?.trim();

    return this.prisma.exercicio.findMany({
      where: {
        createdByPersonalId: personalId,
        ...(level ? { level } : {}),
        ...(muscleGroup ? { muscleGroup: { equals: muscleGroup, mode: 'insensitive' } } : {}),
        ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
      },
      orderBy: { name: 'asc' },
      select: {
        name: true,
        muscleGroup: true,
        description: true,
        defaultSets: true,
        defaultReps: true,
        level: true,
      },
    });
  }

  private validateLevel(value: string | undefined): AlunoLevel | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (!LEVELS.includes(value as AlunoLevel)) {
      throw new BadRequestException('Invalid level filter');
    }

    return value as AlunoLevel;
  }
}