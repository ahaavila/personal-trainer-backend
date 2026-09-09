import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ExerciciosController } from './exercicios.controller.js';
import { ExerciciosService } from './exercicios.service.js';

@Module({
  imports: [AuthModule],
  controllers: [ExerciciosController],
  providers: [ExerciciosService],
})
export class ExerciciosModule {}