import type { AlunoLevel } from '@prisma/client';

export interface ExercicioListingQuery {
  search?: string;
  muscleGroup?: string;
  level?: string;
}

export interface CreateExercicioDto {
  name?: unknown;
  muscleGroup?: unknown;
  equipment?: unknown;
  level?: unknown;
  description?: unknown;
  defaultSets?: unknown;
  defaultReps?: unknown;
}

export interface UpdateExercicioDto extends CreateExercicioDto {}

export interface MediaUploadDto {
  kind?: unknown;
  contentType?: unknown;
  byteSize?: unknown;
}

export interface ConfirmMediaDto {
  kind?: unknown;
  objectKey?: unknown;
  contentType?: unknown;
  byteSize?: unknown;
}

export interface ExercicioListingDto {
  name: string;
  muscleGroup: string;
  equipment: string | null;
  description: string;
  defaultSets: number;
  defaultReps: string;
  level: AlunoLevel;
  media?: Array<{ kind: string; contentType: string; byteSize: number }>;
}

export interface ExercicioCreatedDto extends ExercicioListingDto {
  id: number;
  media: Array<{ kind: string; contentType: string; byteSize: number }>;
}