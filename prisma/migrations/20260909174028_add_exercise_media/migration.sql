-- CreateEnum
CREATE TYPE "ExerciseMediaKind" AS ENUM ('photo', 'video');

-- AlterTable
ALTER TABLE "Exercicio" ADD COLUMN     "equipment" TEXT;

-- CreateTable
CREATE TABLE "ExerciseMedia" (
    "id" SERIAL NOT NULL,
    "exercicioId" INTEGER NOT NULL,
    "kind" "ExerciseMediaKind" NOT NULL,
    "objectKey" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExerciseMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExerciseMedia_exercicioId_kind_key" ON "ExerciseMedia"("exercicioId", "kind");

-- AddForeignKey
ALTER TABLE "ExerciseMedia" ADD CONSTRAINT "ExerciseMedia_exercicioId_fkey" FOREIGN KEY ("exercicioId") REFERENCES "Exercicio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
