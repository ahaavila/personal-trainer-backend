import { PrismaClient, Role } from '@prisma/client';
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
    ],
  });

  const personal = await prisma.user.findUniqueOrThrow({
    where: { email: 'personal@fitforge.app' },
  });

  await prisma.user.update({
    where: { email: 'aluno@fitforge.app' },
    data: { personalId: personal.id },
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