import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { AlunosModule } from './alunos/alunos.module.js';
import { ExerciciosModule } from './exercicios/exercicios.module.js';
import { FichasModule } from './fichas/fichas.module.js';
import { ProgressoModule } from './progresso/progresso.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { EmailModule } from './email/email.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    EmailModule,
    AuthModule,
    DashboardModule,
    AlunosModule,
    ExerciciosModule,
    FichasModule,
    ProgressoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
