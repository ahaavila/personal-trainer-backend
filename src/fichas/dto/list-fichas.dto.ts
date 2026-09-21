import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class ListFichasQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  alunoId?: number;

  @IsOptional()
  @IsString()
  search?: string;
}

export class FichaExerciseMediaDto {
  id: number;
  kind: 'photo' | 'video';
  contentType: string;
  byteSize: number;
}

export class FichaExerciseDto {
  id: number;
  exercicioId: number;
  exerciseId: number;
  exerciseName: string;
  muscleGroup: string;
  equipment: string | null;
  order: number;
  sets: number;
  reps: string;
  restInterval: string | null;
  targetLoad: string | null;
  notes: string | null;
  hasVideo?: boolean;
  media?: FichaExerciseMediaDto[];
}

export class FichaDivisionDto {
  id: number;
  name: string;
  order: number;
  notes: string | null;
  exercises: FichaExerciseDto[];
}

export class FichaListingDto {
  id: number;
  title: string;
  notes: string | null;
  startDate: Date | null;
  endDate: Date | null;
  status: string;
  createdAt: Date;
  alunoId: number;
  studentId: number;
  studentEmail: string;
  studentName: string;
  studentObjective: string | null;
  divisionsCount: number;
  exercisesCount: number;
  divisions: FichaDivisionDto[];
}
