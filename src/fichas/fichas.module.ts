import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { FichasController } from './fichas.controller.js';
import { FichasService } from './fichas.service.js';

@Module({
  imports: [AuthModule],
  controllers: [FichasController],
  providers: [FichasService],
})
export class FichasModule {}
