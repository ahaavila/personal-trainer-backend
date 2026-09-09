import type { AlunoLevel } from '@prisma/client';

export interface ExercicioListingQuery {
  search?: string;
  muscleGroup?: string;
  level?: string;
}

export interface ExercicioListingDto {
  name: string;
  muscleGroup: string;
  description: string;
  defaultSets: number;
  defaultReps: string;
  level: AlunoLevel;
}