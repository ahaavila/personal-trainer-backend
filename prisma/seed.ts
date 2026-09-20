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
        status: AlunoStatus.ativo,
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
    prisma.exercicio.create({
      data: {
        name: 'Puxada alta',
        muscleGroup: 'Costas',
        description: 'Puxada na polia alta pegada aberta.',
        defaultSets: 3,
        defaultReps: '10 a 12',
        level: 'iniciante',
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

  // Seeds de histórico e execuções de treinos para progressão e gráficos
  const day = 24 * 60 * 60 * 1000;
  const now = Date.now();

  // Histórico de Aluno FitForge (progresso constante ao longo de 4 semanas)
  const exec1 = await prisma.treinoExecucao.create({
    data: {
      alunoId: aluno.id,
      treinoId: treinoA.id,
      title: 'Treino A - Peito & Superiores',
      startedAt: new Date(now - 28 * day),
      completedAt: new Date(now - 28 * day + 3600000),
      durationMin: 60,
      notes: 'Primeira sessão, ajustando cargas iniciais.',
      exercicios: {
        create: [
          {
            exercicioId: supino.id,
            order: 1,
            setsCompleted: 3,
            repsCompleted: '12, 10, 10',
            maxWeightKg: 50,
            notes: 'Carga inicial moderada',
          },
          {
            exercicioId: agachamento.id,
            order: 2,
            setsCompleted: 4,
            repsCompleted: '10, 10, 8, 8',
            maxWeightKg: 70,
            notes: 'Foco na postura e amplitude',
          },
        ],
      },
    },
  });

  const exec2 = await prisma.treinoExecucao.create({
    data: {
      alunoId: aluno.id,
      treinoId: treinoA.id,
      title: 'Treino A - Peito & Superiores',
      startedAt: new Date(now - 21 * day),
      completedAt: new Date(now - 21 * day + 3300000),
      durationMin: 55,
      notes: 'Boa sensação, aumento de 5kg no supino.',
      exercicios: {
        create: [
          {
            exercicioId: supino.id,
            order: 1,
            setsCompleted: 3,
            repsCompleted: '12, 10, 9',
            maxWeightKg: 55,
            notes: 'Movimento controlado',
          },
          {
            exercicioId: agachamento.id,
            order: 2,
            setsCompleted: 4,
            repsCompleted: '10, 10, 10, 8',
            maxWeightKg: 75,
            notes: 'Subiu 5kg no agachamento',
          },
        ],
      },
    },
  });

  const exec3 = await prisma.treinoExecucao.create({
    data: {
      alunoId: aluno.id,
      treinoId: treinoA.id,
      title: 'Treino A - Peito & Superiores',
      startedAt: new Date(now - 14 * day),
      completedAt: new Date(now - 14 * day + 3480000),
      durationMin: 58,
      notes: 'Treino forte, mantendo boa execução.',
      exercicios: {
        create: [
          {
            exercicioId: supino.id,
            order: 1,
            setsCompleted: 3,
            repsCompleted: '10, 10, 8',
            maxWeightKg: 60,
            notes: 'Última série pesada mas completa',
          },
          {
            exercicioId: agachamento.id,
            order: 2,
            setsCompleted: 4,
            repsCompleted: '10, 8, 8, 8',
            maxWeightKg: 80,
            notes: 'Sentiu cansaço na lombar na última',
          },
        ],
      },
    },
  });

  const exec4 = await prisma.treinoExecucao.create({
    data: {
      alunoId: aluno.id,
      treinoId: treinoA.id,
      title: 'Treino A - Peito & Superiores',
      startedAt: new Date(now - 7 * day),
      completedAt: new Date(now - 7 * day + 3120000),
      durationMin: 52,
      notes: 'Novo recorde no supino e agachamento.',
      exercicios: {
        create: [
          {
            exercicioId: supino.id,
            order: 1,
            setsCompleted: 4,
            repsCompleted: '10, 10, 8, 6',
            maxWeightKg: 65,
            notes: 'Recorde pessoal (PR)!',
          },
          {
            exercicioId: agachamento.id,
            order: 2,
            setsCompleted: 4,
            repsCompleted: '10, 10, 8, 8',
            maxWeightKg: 85,
            notes: 'Execução muito sólida',
          },
        ],
      },
    },
  });

  const exec5 = await prisma.treinoExecucao.create({
    data: {
      alunoId: aluno.id,
      treinoId: treinoA.id,
      title: 'Treino A - Peito & Superiores',
      startedAt: new Date(now - 1 * day),
      completedAt: new Date(now - 1 * day + 3300000),
      durationMin: 55,
      notes: 'Consolidando a carga máxima de 67.5kg no supino e 90kg no agachamento.',
      exercicios: {
        create: [
          {
            exercicioId: supino.id,
            order: 1,
            setsCompleted: 4,
            repsCompleted: '10, 8, 8, 6',
            maxWeightKg: 67.5,
            notes: 'Ótimo controle excêntrico',
          },
          {
            exercicioId: agachamento.id,
            order: 2,
            setsCompleted: 4,
            repsCompleted: '8, 8, 8, 6',
            maxWeightKg: 90,
            notes: 'Rompeu a barreira dos 90kg',
          },
        ],
      },
    },
  });

  // Histórico de Mariana Costa (emagrecimento e condicionamento)
  await prisma.treinoExecucao.create({
    data: {
      alunoId: mariana.id,
      title: 'Adaptação e Circuito Geral',
      startedAt: new Date(now - 10 * day),
      completedAt: new Date(now - 10 * day + 2700000),
      durationMin: 45,
      notes: 'Adaptação inicial de movimentos.',
      exercicios: {
        create: [
          {
            exercicioId: supino.id,
            order: 1,
            setsCompleted: 3,
            repsCompleted: '15, 12, 12',
            maxWeightKg: 20,
            notes: 'Barra leve',
          },
        ],
      },
    },
  });

  await prisma.treinoExecucao.create({
    data: {
      alunoId: mariana.id,
      title: 'Treino Funcional e Força',
      startedAt: new Date(now - 3 * day),
      completedAt: new Date(now - 3 * day + 3000000),
      durationMin: 50,
      notes: 'Aumentou a resistência e repetições.',
      exercicios: {
        create: [
          {
            exercicioId: supino.id,
            order: 1,
            setsCompleted: 3,
            repsCompleted: '15, 15, 12',
            maxWeightKg: 25,
            notes: 'Progressão de 5kg com facilidade',
          },
        ],
      },
    },
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