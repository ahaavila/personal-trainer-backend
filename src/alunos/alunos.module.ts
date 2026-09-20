import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { EmailModule } from '../email/email.module.js';
import { AlunosController } from './alunos.controller.js';
import { AlunosService } from './alunos.service.js';

@Module({
  imports: [AuthModule, EmailModule],
  controllers: [AlunosController],
  providers: [AlunosService],
})
export class AlunosModule {}