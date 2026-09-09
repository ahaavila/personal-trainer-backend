export interface WeeklyValueDto {
  day: string;
  value: number;
}

export interface PersonalDashboardDto {
  metrics: {
    clientsCount: number;
    exercisesCount: number;
    trainingPlansCount: number;
  };
  upcomingTrainings: Array<{
    id: number;
    name: string;
    planTitle: string;
    alunoName: string;
  }>;
  weeklyEvolution: WeeklyValueDto[];
}

export interface AlunoDashboardDto {
  currentPlan: { id: number; title: string; personalName: string } | null;
  nextWorkouts: Array<{ id: number; name: string; order: number }>;
  progress: { completedWorkouts: number; totalWorkouts: number };
  weeklyActivity: WeeklyValueDto[];
}