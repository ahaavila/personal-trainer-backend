import type { AlunoObjective, AlunoStatus } from '@prisma/client';

export interface CreateAlunoDto {
  name?: unknown;
  email?: unknown;
  objective?: unknown;
  level?: unknown;
}

export interface AlunoListingQuery {
  search?: string;
  status?: string;
  objective?: string;
}

export interface AlunoListingDto {
  id: number;
  name: string;
  email: string;
  objective: AlunoObjective | 'não informado';
  level: string;
  status: AlunoStatus | 'não informado';
  latestWorkout: {
    name: string;
    completedAt: Date;
  } | null;
}