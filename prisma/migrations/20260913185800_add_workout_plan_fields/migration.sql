/*
  Warnings:

  - The primary key for the `TreinoExercicio` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[treinoId,order]` on the table `TreinoExercicio` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Treino" DROP CONSTRAINT "Treino_fichaId_fkey";

-- DropForeignKey
ALTER TABLE "TreinoExercicio" DROP CONSTRAINT "TreinoExercicio_treinoId_fkey";

-- AlterTable
ALTER TABLE "FichaDeTreino" ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "startDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Treino" ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "TreinoExercicio" DROP CONSTRAINT "TreinoExercicio_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "restInterval" TEXT,
ADD COLUMN     "targetLoad" TEXT,
ALTER COLUMN "reps" SET DATA TYPE TEXT,
ADD CONSTRAINT "TreinoExercicio_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "TreinoExercicio_treinoId_order_key" ON "TreinoExercicio"("treinoId", "order");

-- AddForeignKey
ALTER TABLE "Treino" ADD CONSTRAINT "Treino_fichaId_fkey" FOREIGN KEY ("fichaId") REFERENCES "FichaDeTreino"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreinoExercicio" ADD CONSTRAINT "TreinoExercicio_treinoId_fkey" FOREIGN KEY ("treinoId") REFERENCES "Treino"("id") ON DELETE CASCADE ON UPDATE CASCADE;
