-- AlterTable
ALTER TABLE "Exercicio" ADD COLUMN     "defaultReps" TEXT NOT NULL DEFAULT '8 a 12',
ADD COLUMN     "defaultSets" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "description" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "level" "AlunoLevel" NOT NULL DEFAULT 'iniciante';
