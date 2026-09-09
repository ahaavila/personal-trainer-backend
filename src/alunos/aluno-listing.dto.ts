import type { AlunoObjective, AlunoStatus } from '@prisma/client';

export interface AlunoListingQuery {
  search?: string;
  status?: string;
  objective?: string;
}

export interface AlunoListingDto {
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