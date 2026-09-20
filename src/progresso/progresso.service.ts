import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  CreateWorkoutExecutionDto,
  ExerciseProgressSeriesDto,
  StudentProgressDto,
  WorkoutSessionLogDto,
} from './progresso.dto.js';

@Injectable()
export class ProgressoService {
  constructor(private readonly prisma: PrismaService) {}

  async getStudentProgress(
    trainerId: number,
    alunoId: number,
  ): Promise<StudentProgressDto> {
    const aluno = await this.prisma.user.findUnique({
      where: { id: alunoId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        objective: true,
        level: true,
        status: true,
        personalId: true,
      },
    });

    if (!aluno || aluno.role !== 'aluno') {
      throw new NotFoundException('Aluno não encontrado.');
    }

    if (aluno.personalId !== trainerId) {
      throw new ForbiddenException(
        'Acesso negado: este aluno pertence a outro personal trainer.',
      );
    }

    const execucoes = await this.prisma.treinoExecucao.findMany({
      where: { alunoId },
      orderBy: { completedAt: 'desc' },
      include: {
        exercicios: {
          orderBy: { order: 'asc' },
          include: {
            exercicio: {
              select: {
                id: true,
                name: true,
                muscleGroup: true,
              },
            },
          },
        },
      },
    });

    const workoutLogs: WorkoutSessionLogDto[] = execucoes.map((exec) => ({
      id: exec.id,
      title: exec.title,
      startedAt: exec.startedAt.toISOString(),
      completedAt: exec.completedAt.toISOString(),
      durationMin: exec.durationMin,
      durationMinutes: exec.durationMin,
      notes: exec.notes,
      exercises: exec.exercicios.map((exLog) => ({
        id: exLog.id,
        exercicioId: exLog.exercicioId,
        exerciseId: exLog.exercicioId,
        exercicioName: exLog.exercicio.name,
        exerciseName: exLog.exercicio.name,
        muscleGroup: exLog.exercicio.muscleGroup,
        order: exLog.order,
        setsCompleted: exLog.setsCompleted,
        repsCompleted: exLog.repsCompleted,
        maxWeightKg: exLog.maxWeightKg,
        notes: exLog.notes,
      })),
    }));

    // Aggregate exercise progression chronological (oldest to newest)
    const exerciseProgress: Record<string, ExerciseProgressSeriesDto> = {};

    // Sort ascending for progression calculation
    const chronologicalExecucoes = [...execucoes].reverse();

    for (const session of chronologicalExecucoes) {
      const sessionDate = session.completedAt.toISOString().split('T')[0];

      for (const exLog of session.exercicios) {
        const key = String(exLog.exercicioId);

        if (!exerciseProgress[key]) {
          exerciseProgress[key] = {
            exercicioId: exLog.exercicioId,
            exerciseId: exLog.exercicioId,
            exercicioName: exLog.exercicio.name,
            exerciseName: exLog.exercicio.name,
            muscleGroup: exLog.exercicio.muscleGroup,
            currentMaxLoad: exLog.maxWeightKg,
            startLoad: exLog.maxWeightKg,
            totalGainKg: 0,
            percentageGain: 0,
            totalSessions: 0,
            points: [],
            dataPoints: [],
            bestWeightKg: exLog.maxWeightKg,
            latestWeightKg: exLog.maxWeightKg,
            totalSetsPerformed: 0,
          };
        }

        const series = exerciseProgress[key];
        const point = {
          date: sessionDate,
          sessionTitle: session.title,
          setsCompleted: exLog.setsCompleted,
          repsCompleted: exLog.repsCompleted,
          maxWeightKg: exLog.maxWeightKg,
        };

        series.dataPoints.push(point);
        series.points?.push(point);

        series.currentMaxLoad = exLog.maxWeightKg;
        series.latestWeightKg = exLog.maxWeightKg;
        if (exLog.maxWeightKg > series.bestWeightKg) {
          series.bestWeightKg = exLog.maxWeightKg;
        }
        series.totalSessions = (series.totalSessions ?? 0) + 1;
        series.totalSetsPerformed += exLog.setsCompleted;
        series.totalGainKg = Math.round((series.currentMaxLoad - (series.startLoad ?? series.currentMaxLoad)) * 10) / 10;
        const start = series.startLoad ?? 0;
        series.percentageGain = start > 0
          ? Math.round(((series.currentMaxLoad - start) / start) * 1000) / 10
          : 0;
      }
    }

    return {
      aluno: {
        id: aluno.id,
        name: aluno.name,
        email: aluno.email,
        objective: aluno.objective ?? 'não informado',
        level: aluno.level ?? 'não informado',
        status: aluno.status ?? 'ativo',
        totalWorkouts: execucoes.length,
        lastWorkoutAt: execucoes[0]?.completedAt.toISOString() ?? null,
      },
      workoutLogs,
      exerciseProgress,
    };
  }

  async logWorkoutExecution(
    alunoId: number,
    data: CreateWorkoutExecutionDto,
  ): Promise<WorkoutSessionLogDto> {
    if (
      !data.title ||
      !data.startedAt ||
      !data.completedAt ||
      !Array.isArray(data.exercicios) ||
      data.exercicios.length === 0
    ) {
      throw new BadRequestException('Dados de execução de treino inválidos.');
    }

    const startedAt = new Date(data.startedAt);
    const completedAt = new Date(data.completedAt);

    if (isNaN(startedAt.getTime()) || isNaN(completedAt.getTime())) {
      throw new BadRequestException('Datas de início ou conclusão inválidas.');
    }

    // Verify all exercises exist
    const exercicioIds = data.exercicios.map((e) => e.exercicioId);
    const count = await this.prisma.exercicio.count({
      where: { id: { in: exercicioIds } },
    });

    if (count !== exercicioIds.length) {
      throw new BadRequestException('Um ou mais exercícios especificados não existem.');
    }

    const created = await this.prisma.treinoExecucao.create({
      data: {
        alunoId,
        treinoId: data.treinoId,
        title: data.title,
        startedAt,
        completedAt,
        durationMin: data.durationMin,
        notes: data.notes,
        exercicios: {
          create: data.exercicios.map((ex, idx) => ({
            exercicioId: ex.exercicioId,
            order: ex.order ?? idx + 1,
            setsCompleted: ex.setsCompleted,
            repsCompleted: ex.repsCompleted,
            maxWeightKg: ex.maxWeightKg,
            notes: ex.notes,
          })),
        },
      },
      include: {
        exercicios: {
          include: {
            exercicio: {
              select: {
                id: true,
                name: true,
                muscleGroup: true,
              },
            },
          },
        },
      },
    });

    return {
      id: created.id,
      title: created.title,
      startedAt: created.startedAt.toISOString(),
      completedAt: created.completedAt.toISOString(),
      durationMin: created.durationMin,
      durationMinutes: created.durationMin,
      notes: created.notes,
      exercises: created.exercicios.map((exLog) => ({
        id: exLog.id,
        exercicioId: exLog.exercicioId,
        exercicioName: exLog.exercicio.name,
        muscleGroup: exLog.exercicio.muscleGroup,
        order: exLog.order,
        setsCompleted: exLog.setsCompleted,
        repsCompleted: exLog.repsCompleted,
        maxWeightKg: exLog.maxWeightKg,
        notes: exLog.notes,
      })),
    };
  }
}
