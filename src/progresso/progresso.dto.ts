export interface ExercicioLogItemDto {
  id: number;
  exercicioId: number;
  exerciseId?: number;
  exercicioName: string;
  exerciseName?: string;
  muscleGroup: string;
  order: number;
  setsCompleted: number;
  repsCompleted: string;
  maxWeightKg: number;
  notes?: string | null;
}

export interface WorkoutSessionLogDto {
  id: number;
  title: string;
  startedAt: string;
  completedAt: string;
  durationMin: number | null;
  durationMinutes: number | null;
  notes: string | null;
  exercises: ExercicioLogItemDto[];
}

export interface ExerciseProgressPointDto {
  date: string;
  sessionTitle: string;
  setsCompleted: number;
  repsCompleted: string;
  maxWeightKg: number;
}

export interface ExerciseProgressSeriesDto {
  exercicioId: number;
  exerciseId?: number;
  exercicioName: string;
  exerciseName?: string;
  muscleGroup: string;
  currentMaxLoad?: number;
  startLoad?: number;
  totalGainKg?: number;
  percentageGain?: number;
  totalSessions?: number;
  points?: ExerciseProgressPointDto[];
  dataPoints: ExerciseProgressPointDto[];
  bestWeightKg: number;
  latestWeightKg: number;
  totalSetsPerformed: number;
}

export interface StudentProgressSummaryDto {
  id: number;
  name: string;
  email: string;
  objective: string;
  level: string;
  status?: string;
  totalWorkouts: number;
  lastWorkoutAt: string | null;
}

export interface StudentProgressDto {
  aluno: StudentProgressSummaryDto;
  workoutLogs: WorkoutSessionLogDto[];
  exerciseProgress: Record<string, ExerciseProgressSeriesDto>;
}

export interface CreateExercicioExecucaoDto {
  exercicioId: number;
  order?: number;
  setsCompleted: number;
  repsCompleted: string;
  maxWeightKg: number;
  notes?: string;
}

export interface CreateWorkoutExecutionDto {
  alunoId: number;
  treinoId?: number;
  title: string;
  startedAt: string;
  completedAt: string;
  durationMin?: number;
  notes?: string;
  exercicios: CreateExercicioExecucaoDto[];
}
