import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ProgressoController } from './progresso.controller.js';
import { ProgressoService } from './progresso.service.js';

@Module({
  imports: [AuthModule],
  controllers: [ProgressoController],
  providers: [ProgressoService],
  exports: [ProgressoService],
})
export class ProgressoModule {}
