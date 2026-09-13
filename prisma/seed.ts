import {
  AlunoLevel,
  AlunoObjective,
  AlunoStatus,
  PrismaClient,
  Role,
} from '@prisma/client';
import { hashPassword } from '../src/auth/password.js';

const prisma = new PrismaClient();

async function main() {
  const [personalPasswordHash, alunoPasswordHash] = await Promise.all([
    hashPassword('personal123'),
    hashPassword('aluno123'),
  ]);

  await prisma.$transaction([
    prisma.treinoExercicio.deleteMany(),
    prisma.treino.deleteMany(),
    prisma.fichaDeTreino.deleteMany(),
    prisma.exercicio.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  await prisma.user.createMany({
    data: [
      {
        email: 'personal@fitforge.app',
        passwordHash: personalPasswordHash,
        name: 'Personal FitForge',
        role: Role.personal,
      },
      {
        email: 'aluno@fitforge.app',
        passwordHash: alunoPasswordHash,
        name: 'Aluno FitForge',
        role: Role.aluno,
      },
      {
        email: 'mariana@fitforge.app',
        passwordHash: alunoPasswordHash,
        name: 'Mariana Costa',
        role: Role.aluno,
        objective: AlunoObjective.emagrecimento,
        level: AlunoLevel.iniciante,
        status: AlunoStatus.ativo,
      },
      {
        email: 'lucas@fitforge.app',
        passwordHash: alunoPasswordHash,
        name: 'Lucas Almeida',
        role: Role.aluno,
        objective: AlunoObjective.condicionamento,
        level: AlunoLevel.intermediario,
        status: AlunoStatus.inativo,
      },
      {
        email: 'other-personal@fitforge.app',
        passwordHash: personalPasswordHash,
        name: 'Personal Outra Conta',
        role: Role.personal,
      },
      {
        email: 'other-aluno@fitforge.app',
        passwordHash: alunoPasswordHash,
        name: 'Aluno Outra Conta',
        role: Role.aluno,
        objective: AlunoObjective.hipertrofia,
        level: AlunoLevel.avancado,
        status: AlunoStatus.ativo,
      },
    ],
  });

  const personal = await prisma.user.findUniqueOrThrow({
    where: { email: 'personal@fitforge.app' },
  });
  const otherPersonal = await prisma.user.findUniqueOrThrow({
    where: { email: 'other-personal@fitforge.app' },
  });

  await prisma.user.updateMany({
    where: { email: { in: ['aluno@fitforge.app', 'mariana@fitforge.app', 'lucas@fitforge.app'] } },
    data: { personalId: personal.id },
  });
  await prisma.user.update({
    where: { email: 'other-aluno@fitforge.app' },
    data: { personalId: otherPersonal.id },
  });

  const [aluno, mariana] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { email: 'aluno@fitforge.app' } }),
    prisma.user.findUniqueOrThrow({ where: { email: 'mariana@fitforge.app' } }),
  ]);
  const [supino, agachamento] = await Promise.all([
    prisma.exercicio.create({
      data: {
        name: 'Supino reto',
        muscleGroup: 'Peito',
        description: 'Empurrada horizontal com barra.',
        defaultSets: 3,
        defaultReps: '8 a 12',
        level: 'intermediario',
        createdByPersonalId: personal.id,
      },
    }),
    prisma.exercicio.create({
      data: {
        name: 'Agachamento livre',
        muscleGroup: 'Pernas',
        description: 'Agachamento com barra livre.',
        defaultSets: 4,
        defaultReps: '6 a 10',
        level: 'avancado',
        createdByPersonalId: personal.id,
      },
    }),
  ]);
  const ficha = await prisma.fichaDeTreino.create({
    data: { alunoId: aluno.id, personalId: personal.id, title: 'Ficha de hipertrofia' },
  });
  const treinoA = await prisma.treino.create({
    data: { fichaId: ficha.id, name: 'Treino A', order: 1, completedAt: new Date(Date.now() - 86400000) },
  });
  const treinoB = await prisma.treino.create({
    data: { fichaId: ficha.id, name: 'Treino B', order: 2 },
  });
  await prisma.treinoExercicio.createMany({
    data: [
      { treinoId: treinoA.id, exercicioId: supino.id, sets: 3, reps: '12' },
      { treinoId: treinoB.id, exercicioId: agachamento.id, sets: 4, reps: '10' },
    ],
  });
  await prisma.fichaDeTreino.create({
    data: { alunoId: mariana.id, personalId: personal.id, title: 'Ficha inicial' },
  });
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });