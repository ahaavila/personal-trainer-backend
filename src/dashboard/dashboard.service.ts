import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AlunoDashboardDto, PersonalDashboardDto, WeeklyValueDto } from './dashboard.dto.js';

const DAYS_IN_WEEK = 7;
const UPCOMING_TRAININGS_LIMIT = 5;

function weeklyZeros(): WeeklyValueDto[] {
  return Array.from({ length: DAYS_IN_WEEK }, (_, index) => ({
    day: `day-${index + 1}`,
    value: 0,
  }));
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getPersonalDashboard(personalId: number): Promise<PersonalDashboardDto> {
    const [clientsCount, exercisesCount, trainingPlansCount, upcomingTrainings] =
      await Promise.all([
        this.prisma.user.count({ where: { personalId } }),
        this.prisma.exercicio.count({ where: { createdByPersonalId: personalId } }),
        this.prisma.fichaDeTreino.count({ where: { personalId } }),
        this.prisma.treino.findMany({
          where: { ficha: { personalId } },
          orderBy: [{ fichaId: 'asc' }, { order: 'asc' }],
          take: UPCOMING_TRAININGS_LIMIT,
          select: {
            id: true,
            name: true,
            ficha: { select: { title: true, aluno: { select: { name: true } } } },
          },
        }),
      ]);

    return {
      metrics: { clientsCount, exercisesCount, trainingPlansCount },
      upcomingTrainings: upcomingTrainings.map((training) => ({
        id: training.id,
        name: training.name,
        planTitle: training.ficha.title,
        alunoName: training.ficha.aluno.name,
      })),
      weeklyEvolution: weeklyZeros(),
    };
  }

  async getAlunoDashboard(alunoId: number): Promise<AlunoDashboardDto> {
    const plan = await this.prisma.fichaDeTreino.findFirst({
      where: { alunoId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        personal: { select: { name: true } },
        treinos: { orderBy: { order: 'asc' }, select: { id: true, name: true, order: true } },
      },
    });

    return {
      currentPlan: plan
        ? { id: plan.id, title: plan.title, personalName: plan.personal.name }
        : null,
      nextWorkouts: plan?.treinos ?? [],
      progress: { completedWorkouts: 0, totalWorkouts: plan?.treinos.length ?? 0 },
      weeklyActivity: weeklyZeros(),
    };
  }
}