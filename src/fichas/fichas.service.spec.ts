import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { FichasService } from './fichas.service.js';

// Mock factory functions that don't use jest at module load time
const createMockFichaDeTreino = () => ({
  findMany: () => Promise.resolve([]),
  findFirst: () => Promise.resolve(null),
  create: () => Promise.resolve({}),
});

const createMockPrismaService = () => ({
  fichaDeTreino: createMockFichaDeTreino(),
  user: {
    findFirst: () => Promise.resolve(null),
  },
  exercicio: {
    findMany: () => Promise.resolve([]),
  },
  $transaction: () => Promise.resolve([]),
});

describe('FichasService', () => {
  let service: FichasService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FichasService,
        {
          provide: PrismaService,
          useValue: createMockPrismaService(),
        },
      ],
    }).compile();

    service = module.get<FichasService>(FichasService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('list', () => {
    it('should return all training plans when no filters provided', async () => {
      const personalId = 1;
      const mockData = [
        {
          id: 1,
          title: 'Hypertrophy',
          notes: null,
          startDate: null,
          endDate: null,
          createdAt: new Date(),
          status: 'active',
          alunoId: 2,
          aluno: {
            id: 2,
            name: 'Student A',
            email: 'student@test.com',
            objective: 'hipertrofia',
          },
          treinos: [
            {
              id: 1,
              name: 'Treino A',
              order: 1,
              notes: null,
              treinoExercicios: [{ id: 1, exercicioId: 1, order: 1, sets: 3, reps: '10-12', restInterval: null, targetLoad: null, notes: null, exercicio: { id: 1, name: 'Ex', muscleGroup: 'Chest', equipment: null } }, { id: 2, exercicioId: 2, order: 2, sets: 3, reps: '10-12', restInterval: null, targetLoad: null, notes: null, exercicio: { id: 2, name: 'Ex2', muscleGroup: 'Back', equipment: null } }],
            },
          ],
        },
      ];

      (prisma.fichaDeTreino.findMany as any) = async () => mockData;

      const result = await service.list(personalId, {});

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(result[0].divisionsCount).toBe(1);
      expect(result[0].exercisesCount).toBe(2);
    });

    it('should filter by alunoId when provided', async () => {
      const personalId = 1;
      const alunoId = 2;
      let capturedQuery: any;

      (prisma.fichaDeTreino.findMany as any) = async (query: any) => {
        capturedQuery = query;
        return [];
      };

      await service.list(personalId, { alunoId });

      expect(capturedQuery?.where?.personalId).toBe(personalId);
      expect(capturedQuery?.where?.alunoId).toBe(alunoId);
    });

    it('should filter by search term', async () => {
      const personalId = 1;
      let searchCalled = false;

      (prisma.fichaDeTreino.findMany as any) = async () => {
        searchCalled = true;
        return [];
      };

      await service.list(personalId, { search: 'test' });

      expect(searchCalled).toBe(true);
    });

    it('should calculate metrics correctly', async () => {
      const personalId = 1;
      const mockData = [
        {
          id: 1,
          title: 'Plan',
          notes: null,
          startDate: null,
          endDate: null,
          createdAt: new Date(),
          status: 'active',
          alunoId: 2,
          aluno: { id: 2, name: 'S', email: 'e@t.com', objective: 'f' },
          treinos: [
            {
              id: 1,
              name: 'D1',
              order: 1,
              notes: null,
              treinoExercicios: [
                { id: 1, exercicioId: 1, order: 1, sets: 3, reps: '10', restInterval: null, targetLoad: null, notes: null, exercicio: { id: 1, name: 'E1', muscleGroup: 'C', equipment: null } },
                { id: 2, exercicioId: 2, order: 2, sets: 3, reps: '10', restInterval: null, targetLoad: null, notes: null, exercicio: { id: 2, name: 'E2', muscleGroup: 'B', equipment: null } },
              ],
            },
            {
              id: 2,
              name: 'D2',
              order: 2,
              notes: null,
              treinoExercicios: [
                { id: 3, exercicioId: 3, order: 1, sets: 3, reps: '10', restInterval: null, targetLoad: null, notes: null, exercicio: { id: 3, name: 'E3', muscleGroup: 'L', equipment: null } },
              ],
            },
          ],
        },
      ];

      (prisma.fichaDeTreino.findMany as any) = async () => mockData;

      const result = await service.list(personalId, {});

      expect(result[0].divisionsCount).toBe(2);
      expect(result[0].exercisesCount).toBe(3);
    });
  });

  describe('findById', () => {
    it('should return a training plan when found', async () => {
      const personalId = 1;
      const fichaId = 1;
      const mockData = {
        id: fichaId,
        title: 'Hypertrophy',
        notes: null,
        startDate: null,
        endDate: null,
        createdAt: new Date(),
        status: 'active',
        alunoId: 2,
        aluno: {
          id: 2,
          name: 'Student A',
          email: 'student@test.com',
          objective: 'hipertrofia',
        },
        treinos: [
          {
            id: 1,
            name: 'Workout A',
            order: 1,
            notes: null,
            treinoExercicios: [{ id: 1, exercicioId: 1, order: 1, sets: 3, reps: '10-12', restInterval: null, targetLoad: null, notes: null, exercicio: { id: 1, name: 'Ex', muscleGroup: 'Chest', equipment: null } }],
          },
        ],
      };

      (prisma.fichaDeTreino.findFirst as any) = async () => mockData;

      const result = await service.findById(personalId, fichaId);

      expect(result.id).toBe(fichaId);
      expect(result.title).toBe('Hypertrophy');
      expect(result.studentName).toBe('Student A');
    });

    it('should throw NotFoundException when plan not found', async () => {
      const personalId = 1;
      const fichaId = 999;

      (prisma.fichaDeTreino.findFirst as any) = async () => null;

      await expect(service.findById(personalId, fichaId)).rejects.toThrow(NotFoundException);
    });

    it('should verify ownership via findFirst where clause', async () => {
      const personalId = 1;
      const fichaId = 1;
      let capturedQuery: any;

      (prisma.fichaDeTreino.findFirst as any) = async (query: any) => {
        capturedQuery = query;
        return null;
      };

      await expect(service.findById(personalId, fichaId)).rejects.toThrow(NotFoundException);

      expect(capturedQuery?.where?.personalId).toBe(personalId);
      expect(capturedQuery?.where?.id).toBe(fichaId);
    });

    it('should map nested relations correctly', async () => {
      const personalId = 1;
      const fichaId = 1;
      const mockData = {
        id: fichaId,
        title: 'Plan',
        notes: null,
        startDate: null,
        endDate: null,
        createdAt: new Date(),
        status: 'active',
        alunoId: 2,
        aluno: { id: 2, name: 'S', email: 'e@t.com', objective: 'f' },
        treinos: [
          {
            id: 1,
            name: 'Division',
            order: 1,
            notes: null,
            treinoExercicios: [
              {
                id: 1,
                exercicioId: 1,
                order: 1,
                sets: 3,
                reps: '10-12',
                restInterval: '30s',
                targetLoad: '10kg',
                notes: 'Fast',
                exercicio: {
                  id: 1,
                  name: 'Exercise',
                  muscleGroup: 'Chest',
                  equipment: 'Dumbbell',
                },
              },
            ],
          },
        ],
      };

      (prisma.fichaDeTreino.findFirst as any) = async () => mockData;

      const result = await service.findById(personalId, fichaId);

      expect(result.divisions).toHaveLength(1);
      expect(result.divisions[0].exercises).toHaveLength(1);
      expect(result.divisions[0].exercises[0].exerciseName).toBe('Exercise');
      expect(result.divisions[0].exercises[0].restInterval).toBe('30s');
    });
  });
});
