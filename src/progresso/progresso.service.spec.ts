import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ProgressoService } from './progresso.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('ProgressoService', () => {
  let service: ProgressoService;
  let users: Array<any>;
  let execucoes: Array<any>;
  let exercicios: Array<any>;

  beforeEach(async () => {
    users = [
      {
        id: 1,
        name: 'Personal Trainer',
        email: 'trainer@fitforge.app',
        role: 'personal',
      },
      {
        id: 2,
        name: 'Aluno Assigned',
        email: 'aluno1@fitforge.app',
        role: 'aluno',
        personalId: 1,
        objective: 'hipertrofia',
        level: 'iniciante',
        status: 'ativo',
      },
      {
        id: 3,
        name: 'Aluno Other',
        email: 'aluno2@fitforge.app',
        role: 'aluno',
        personalId: 99,
        objective: 'emagrecimento',
        level: 'intermediario',
        status: 'ativo',
      },
    ];

    exercicios = [
      { id: 101, name: 'Supino Reto', muscleGroup: 'Peitoral' },
      { id: 102, name: 'Crucifixo Inclinado', muscleGroup: 'Peitoral' },
    ];

    execucoes = [
      {
        id: 1,
        alunoId: 2,
        treinoId: 10,
        title: 'Treino A - Peito',
        startedAt: new Date('2026-09-10T10:00:00Z'),
        completedAt: new Date('2026-09-10T11:00:00Z'),
        durationMin: 60,
        notes: 'Boa sessão',
        exercicios: [
          {
            id: 1,
            treinoExecucaoId: 1,
            exercicioId: 101,
            order: 1,
            setsCompleted: 4,
            repsCompleted: '12, 10, 8, 8',
            maxWeightKg: 60,
            notes: null,
            exercicio: exercicios[0],
          },
        ],
      },
      {
        id: 2,
        alunoId: 2,
        treinoId: 10,
        title: 'Treino A - Peito Semana 2',
        startedAt: new Date('2026-09-17T10:00:00Z'),
        completedAt: new Date('2026-09-17T11:05:00Z'),
        durationMin: 65,
        notes: 'Aumentou carga no supino',
        exercicios: [
          {
            id: 2,
            treinoExecucaoId: 2,
            exercicioId: 101,
            order: 1,
            setsCompleted: 4,
            repsCompleted: '10, 10, 8, 8',
            maxWeightKg: 65,
            notes: null,
            exercicio: exercicios[0],
          },
          {
            id: 3,
            treinoExecucaoId: 2,
            exercicioId: 102,
            order: 2,
            setsCompleted: 3,
            repsCompleted: '12, 12, 10',
            maxWeightKg: 16,
            notes: null,
            exercicio: exercicios[1],
          },
        ],
      },
    ];

    const mockPrismaService = {
      user: {
        findUnique: (args: any) => {
          const user = users.find((u) => u.id === args.where.id);
          return Promise.resolve(user ? { ...user } : null);
        },
      },
      treinoExecucao: {
        findMany: (args: any) => {
          const list = execucoes.filter((e) => e.alunoId === args.where.alunoId);
          // sorted by completedAt desc
          const sorted = [...list].sort(
            (a, b) => b.completedAt.getTime() - a.completedAt.getTime(),
          );
          return Promise.resolve(sorted);
        },
        create: (args: any) => {
          const newId = execucoes.length + 1;
          const newExLogs = args.data.exercicios.create.map(
            (ex: any, idx: number) => {
              const matchedEx = exercicios.find((e) => e.id === ex.exercicioId);
              return {
                id: idx + 10,
                treinoExecucaoId: newId,
                exercicioId: ex.exercicioId,
                order: ex.order,
                setsCompleted: ex.setsCompleted,
                repsCompleted: ex.repsCompleted,
                maxWeightKg: ex.maxWeightKg,
                notes: ex.notes ?? null,
                exercicio: matchedEx,
              };
            },
          );

          const item = {
            id: newId,
            alunoId: args.data.alunoId,
            treinoId: args.data.treinoId,
            title: args.data.title,
            startedAt: args.data.startedAt,
            completedAt: args.data.completedAt,
            durationMin: args.data.durationMin,
            notes: args.data.notes,
            exercicios: newExLogs,
          };
          execucoes.push(item);
          return Promise.resolve(item);
        },
      },
      exercicio: {
        count: (args: any) => {
          const ids = args.where.id.in as number[];
          const matches = exercicios.filter((e) => ids.includes(e.id));
          return Promise.resolve(matches.length);
        },
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgressoService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ProgressoService>(ProgressoService);
  });

  describe('getStudentProgress', () => {
    it('returns student progress with workout logs and progressive overload calculation for assigned student', async () => {
      const result = await service.getStudentProgress(1, 2);

      expect(result.aluno).toMatchObject({
        id: 2,
        name: 'Aluno Assigned',
        email: 'aluno1@fitforge.app',
        objective: 'hipertrofia',
        level: 'iniciante',
        totalWorkouts: 2,
      });

      // timeline descending (newest first)
      expect(result.workoutLogs).toHaveLength(2);
      expect(result.workoutLogs[0].title).toBe('Treino A - Peito Semana 2');
      expect(result.workoutLogs[1].title).toBe('Treino A - Peito');

      // exercise progressive overload metrics
      const supinoProg = result.exerciseProgress['101'];
      expect(supinoProg).toBeDefined();
      expect(supinoProg.exercicioName).toBe('Supino Reto');
      expect(supinoProg.bestWeightKg).toBe(65);
      expect(supinoProg.latestWeightKg).toBe(65);
      expect(supinoProg.totalSetsPerformed).toBe(8);
      expect(supinoProg.dataPoints).toHaveLength(2);
      expect(supinoProg.dataPoints[0].maxWeightKg).toBe(60);
      expect(supinoProg.dataPoints[1].maxWeightKg).toBe(65);

      const crucifixoProg = result.exerciseProgress['102'];
      expect(crucifixoProg).toBeDefined();
      expect(crucifixoProg.bestWeightKg).toBe(16);
      expect(crucifixoProg.dataPoints).toHaveLength(1);
    });

    it('throws ForbiddenException when trainer does not own the student', async () => {
      await expect(service.getStudentProgress(1, 3)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws NotFoundException when student does not exist', async () => {
      await expect(service.getStudentProgress(1, 999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('logWorkoutExecution', () => {
    it('creates workout execution and records exercise set details', async () => {
      const result = await service.logWorkoutExecution(2, {
        alunoId: 2,
        title: 'Treino B',
        startedAt: '2026-09-20T14:00:00Z',
        completedAt: '2026-09-20T15:00:00Z',
        durationMin: 60,
        exercicios: [
          {
            exercicioId: 101,
            setsCompleted: 4,
            repsCompleted: '10, 10, 10, 10',
            maxWeightKg: 70,
          },
        ],
      });

      expect(result.title).toBe('Treino B');
      expect(result.exercises).toHaveLength(1);
      expect(result.exercises[0].maxWeightKg).toBe(70);
    });

    it('rejects invalid payload or missing exercises with BadRequestException', async () => {
      await expect(
        service.logWorkoutExecution(2, {
          alunoId: 2,
          title: '',
          startedAt: 'invalid-date',
          completedAt: 'invalid-date',
          exercicios: [],
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.logWorkoutExecution(2, {
          alunoId: 2,
          title: 'Treino Test',
          startedAt: '2026-09-20T14:00:00Z',
          completedAt: '2026-09-20T15:00:00Z',
          exercicios: [
            {
              exercicioId: 9999, // Non-existent exercise
              setsCompleted: 3,
              repsCompleted: '10',
              maxWeightKg: 20,
            },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
