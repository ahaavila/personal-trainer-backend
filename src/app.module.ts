import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { AlunosModule } from './alunos/alunos.module.js';
import { ExerciciosModule } from './exercicios/exercicios.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    DashboardModule,
    AlunosModule,
    ExerciciosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
