import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import {
  SessionAuthGuard,
  type AuthenticatedRequest,
} from '../auth/session-auth.guard.js';
import { ProgressoService } from './progresso.service.js';
import type { CreateWorkoutExecutionDto } from './progresso.dto.js';

@Controller('api')
@UseGuards(SessionAuthGuard, RolesGuard)
export class ProgressoController {
  constructor(private readonly progressoService: ProgressoService) {}

  @Get('alunos/:id/progresso')
  @Roles('personal')
  getStudentProgress(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) alunoId: number,
  ) {
    return this.progressoService.getStudentProgress(request.user!.id, alunoId);
  }

  @Post('treinos/execucoes')
  @Roles('aluno', 'personal')
  logWorkoutExecution(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateWorkoutExecutionDto,
  ) {
    const alunoId =
      request.user!.role === 'aluno' ? request.user!.id : body.alunoId;

    if (!alunoId) {
      throw new BadRequestException('ID do aluno não informado.');
    }

    return this.progressoService.logWorkoutExecution(alunoId, body);
  }
}
