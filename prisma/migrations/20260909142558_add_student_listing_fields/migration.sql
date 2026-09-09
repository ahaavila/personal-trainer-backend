-- CreateEnum
CREATE TYPE "AlunoObjective" AS ENUM ('hipertrofia', 'emagrecimento', 'condicionamento');

-- CreateEnum
CREATE TYPE "AlunoLevel" AS ENUM ('iniciante', 'intermediario', 'avancado');

-- CreateEnum
CREATE TYPE "AlunoStatus" AS ENUM ('ativo', 'inativo');

-- AlterTable
ALTER TABLE "Treino" ADD COLUMN     "completedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "level" "AlunoLevel",
ADD COLUMN     "objective" "AlunoObjective",
ADD COLUMN     "status" "AlunoStatus";
