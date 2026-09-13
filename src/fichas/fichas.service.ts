import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateFichaDto } from './dto/create-ficha.dto.js';

@Injectable()
export class FichasService {
  constructor(private readonly prisma: PrismaService) {}

  async create(personalId: number, input: CreateFichaDto) {
    if (!input.divisions || input.divisions.length === 0) {
      throw new BadRequestException('At least one division is required');
    }

    const student = await this.prisma.user.findFirst({
      where: { id: input.alunoId, personalId },
      select: { id: true },
    });

    if (!student) {
      throw new ForbiddenException('Student does not belong to this personal');
    }

    const exerciseIds = [...new Set(input.divisions.flatMap((division) => division.exercises.map((exercise) => exercise.exercicioId)))];
    if (exerciseIds.length === 0) {
      throw new BadRequestException('At least one exercise is required');
    }

    const exercises = await this.prisma.exercicio.findMany({
      where: {
        id: { in: exerciseIds },
        createdByPersonalId: personalId,
      },
      select: { id: true },
    });

    if (exercises.length !== exerciseIds.length) {
      throw new ForbiddenException('One or more exercises are not available to this personal');
    }

    return this.prisma.$transaction(async (tx) => {
      const ficha = await tx.fichaDeTreino.create({
        data: {
          alunoId: input.alunoId,
          personalId,
          title: input.title.trim(),
          notes: input.notes?.trim() || null,
          startDate: input.startDate ? new Date(input.startDate) : null,
          endDate: input.endDate ? new Date(input.endDate) : null,
          treinos: {
            create: input.divisions.map((division) => ({
              name: division.name.trim(),
              order: division.order,
              notes: division.notes?.trim() || null,
              treinoExercicios: {
                create: division.exercises.map((exercise) => ({
                  exercicioId: exercise.exercicioId,
                  order: exercise.order,
                  sets: exercise.sets,
                  reps: exercise.reps.trim(),
                  restInterval: exercise.restInterval?.trim() || null,
                  targetLoad: exercise.targetLoad?.trim() || null,
                  notes: exercise.notes?.trim() || null,
                })),
              },
            })),
          },
        },
        include: {
          treinos: {
            include: { treinoExercicios: true },
          },
        },
      });

      return ficha;
    });
  }
}
