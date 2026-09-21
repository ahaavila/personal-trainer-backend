import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { EmailService } from '../email/email.service.js';
import type { CreateFichaDto } from './dto/create-ficha.dto.js';
import type { FichaListingDto, ListFichasQueryDto } from './dto/list-fichas.dto.js';

@Injectable()
export class FichasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

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

  async list(
    user: { id: number; role: 'personal' | 'aluno' },
    query: ListFichasQueryDto,
  ): Promise<FichaListingDto[]> {
    const whereCondition =
      user.role === 'aluno'
        ? { alunoId: user.id }
        : {
            personalId: user.id,
            ...(query.alunoId ? { alunoId: query.alunoId } : {}),
          };

    const fichas = await this.prisma.fichaDeTreino.findMany({
      where: {
        ...whereCondition,
        ...(query.search
          ? {
              OR: [
                { title: { contains: query.search, mode: 'insensitive' } },
                { aluno: { name: { contains: query.search, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        aluno: {
          select: { id: true, name: true, email: true, objective: true },
        },
        treinos: {
          orderBy: { order: 'asc' },
          include: {
            treinoExercicios: {
              orderBy: { order: 'asc' },
              include: {
                exercicio: {
                  select: {
                    id: true,
                    name: true,
                    muscleGroup: true,
                    equipment: true,
                    media: {
                      select: {
                        id: true,
                        kind: true,
                        contentType: true,
                        byteSize: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return fichas.map((ficha) => {
      const divisionsCount = ficha.treinos.length;
      const exercisesCount = ficha.treinos.reduce(
        (sum, treino) => sum + treino.treinoExercicios.length,
        0,
      );

      return {
        id: ficha.id,
        title: ficha.title,
        notes: ficha.notes,
        startDate: ficha.startDate,
        endDate: ficha.endDate,
        status: ficha.status || 'active',
        createdAt: ficha.createdAt,
        alunoId: ficha.alunoId,
        studentId: ficha.aluno.id,
        studentEmail: ficha.aluno.email,
        studentName: ficha.aluno.name,
        studentObjective: ficha.aluno.objective,
        divisionsCount,
        exercisesCount,
        divisions: ficha.treinos.map((treino) => ({
          id: treino.id,
          name: treino.name,
          order: treino.order,
          notes: treino.notes,
          exercises: treino.treinoExercicios.map((treinoExercicio) => {
            const media = treinoExercicio.exercicio.media || [];
            const hasVideo = media.some((m) => m.kind === 'video');

            return {
              id: treinoExercicio.id,
              exercicioId: treinoExercicio.exercicioId,
              exerciseId: treinoExercicio.exercicioId,
              exerciseName: treinoExercicio.exercicio.name,
              muscleGroup: treinoExercicio.exercicio.muscleGroup,
              equipment: treinoExercicio.exercicio.equipment,
              order: treinoExercicio.order,
              sets: treinoExercicio.sets,
              reps: treinoExercicio.reps,
              restInterval: treinoExercicio.restInterval,
              targetLoad: treinoExercicio.targetLoad,
              notes: treinoExercicio.notes,
              hasVideo,
              media,
            };
          }),
        })),
      };
    });
  }

  async findById(
    user: { id: number; role: 'personal' | 'aluno' },
    id: number,
  ): Promise<FichaListingDto> {
    const whereCondition =
      user.role === 'aluno' ? { id, alunoId: user.id } : { id, personalId: user.id };

    const ficha = await this.prisma.fichaDeTreino.findFirst({
      where: whereCondition,
      include: {
        aluno: {
          select: { id: true, name: true, email: true, objective: true },
        },
        treinos: {
          orderBy: { order: 'asc' },
          include: {
            treinoExercicios: {
              orderBy: { order: 'asc' },
              include: {
                exercicio: {
                  select: {
                    id: true,
                    name: true,
                    muscleGroup: true,
                    equipment: true,
                    media: {
                      select: {
                        id: true,
                        kind: true,
                        contentType: true,
                        byteSize: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!ficha) {
      throw new NotFoundException('Training plan not found');
    }

    const divisionsCount = ficha.treinos.length;
    const exercisesCount = ficha.treinos.reduce(
      (sum, treino) => sum + treino.treinoExercicios.length,
      0,
    );

    return {
      id: ficha.id,
      title: ficha.title,
      notes: ficha.notes,
      startDate: ficha.startDate,
      endDate: ficha.endDate,
      status: ficha.status || 'active',
      createdAt: ficha.createdAt,
      alunoId: ficha.alunoId,
      studentId: ficha.aluno.id,
      studentEmail: ficha.aluno.email,
      studentName: ficha.aluno.name,
      studentObjective: ficha.aluno.objective,
      divisionsCount,
      exercisesCount,
      divisions: ficha.treinos.map((treino) => ({
        id: treino.id,
        name: treino.name,
        order: treino.order,
        notes: treino.notes,
        exercises: treino.treinoExercicios.map((treinoExercicio) => {
          const media = treinoExercicio.exercicio.media || [];
          const hasVideo = media.some((m) => m.kind === 'video');

          return {
            id: treinoExercicio.id,
            exercicioId: treinoExercicio.exercicioId,
            exerciseId: treinoExercicio.exercicioId,
            exerciseName: treinoExercicio.exercicio.name,
            muscleGroup: treinoExercicio.exercicio.muscleGroup,
            equipment: treinoExercicio.exercicio.equipment,
            order: treinoExercicio.order,
            sets: treinoExercicio.sets,
            reps: treinoExercicio.reps,
            restInterval: treinoExercicio.restInterval,
            targetLoad: treinoExercicio.targetLoad,
            notes: treinoExercicio.notes,
            hasVideo,
            media,
          };
        }),
      })),
    };
  }

  async update(
    personalId: number,
    id: number,
    input: CreateFichaDto,
  ): Promise<FichaListingDto> {
    const existing = await this.prisma.fichaDeTreino.findFirst({
      where: { id, personalId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Training plan not found');
    }

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

    const exerciseIds = [
      ...new Set(
        input.divisions.flatMap((division) =>
          division.exercises.map((exercise) => exercise.exercicioId),
        ),
      ),
    ];
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
      throw new ForbiddenException(
        'One or more exercises are not available to this personal',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.treino.deleteMany({ where: { fichaId: id } });

      await tx.fichaDeTreino.update({
        where: { id },
        data: {
          alunoId: input.alunoId,
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
      });
    });

    return this.findById({ id: personalId, role: 'personal' }, id);
  }

  async delete(personalId: number, id: number): Promise<void> {
    const existing = await this.prisma.fichaDeTreino.findFirst({
      where: { id, personalId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Training plan not found');
    }

    await this.prisma.fichaDeTreino.delete({
      where: { id },
    });
  }

  async requestActivation(alunoId: number): Promise<{ message: string }> {
    const aluno = await this.prisma.user.findUnique({
      where: { id: alunoId },
      include: {
        personal: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!aluno || aluno.role !== 'aluno') {
      throw new NotFoundException('Aluno não encontrado.');
    }

    if (!aluno.personal) {
      throw new BadRequestException('Não tem nenhum personal trainer associado à sua conta.');
    }

    await this.emailService.sendWorkoutRequestNotificationEmail(
      aluno.personal.email,
      aluno.personal.name,
      aluno.name,
    );

    return {
      message: 'O seu Personal Trainer foi notificado por e-mail para disponibilizar uma nova ficha de treino.',
    };
  }
}
