-- CreateTable
CREATE TABLE "TreinoExecucao" (
    "id" SERIAL NOT NULL,
    "alunoId" INTEGER NOT NULL,
    "treinoId" INTEGER,
    "title" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "durationMin" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TreinoExecucao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExercicioExecucaoLog" (
    "id" SERIAL NOT NULL,
    "treinoExecucaoId" INTEGER NOT NULL,
    "exercicioId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 1,
    "setsCompleted" INTEGER NOT NULL,
    "repsCompleted" TEXT NOT NULL,
    "maxWeightKg" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExercicioExecucaoLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TreinoExecucao_alunoId_idx" ON "TreinoExecucao"("alunoId");

-- CreateIndex
CREATE INDEX "TreinoExecucao_completedAt_idx" ON "TreinoExecucao"("completedAt");

-- CreateIndex
CREATE INDEX "ExercicioExecucaoLog_treinoExecucaoId_idx" ON "ExercicioExecucaoLog"("treinoExecucaoId");

-- CreateIndex
CREATE INDEX "ExercicioExecucaoLog_exercicioId_idx" ON "ExercicioExecucaoLog"("exercicioId");

-- AddForeignKey
ALTER TABLE "TreinoExecucao" ADD CONSTRAINT "TreinoExecucao_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreinoExecucao" ADD CONSTRAINT "TreinoExecucao_treinoId_fkey" FOREIGN KEY ("treinoId") REFERENCES "Treino"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExercicioExecucaoLog" ADD CONSTRAINT "ExercicioExecucaoLog_treinoExecucaoId_fkey" FOREIGN KEY ("treinoExecucaoId") REFERENCES "TreinoExecucao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExercicioExecucaoLog" ADD CONSTRAINT "ExercicioExecucaoLog_exercicioId_fkey" FOREIGN KEY ("exercicioId") REFERENCES "Exercicio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
