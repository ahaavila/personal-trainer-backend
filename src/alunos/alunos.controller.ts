import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import {
  SessionAuthGuard,
  type AuthenticatedRequest,
} from '../auth/session-auth.guard.js';
import type { AlunoListingQuery, CreateAlunoDto } from './aluno-listing.dto.js';
import { AlunosService } from './alunos.service.js';
import { UpdateAlunoStatusDto } from './update-aluno-status.dto.js';

@Controller('api/alunos')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('personal')
export class AlunosController {
  constructor(private readonly alunosService: AlunosService) {}

  @Get()
  list(@Req() request: AuthenticatedRequest, @Query() query: AlunoListingQuery) {
    return this.alunosService.list(request.user!.id, query);
  }

  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() input: CreateAlunoDto) {
    return this.alunosService.create(request.user!.id, input, request.user?.name);
  }

  @Patch(':id/status')
  updateStatus(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) alunoId: number,
    @Body() body: UpdateAlunoStatusDto,
  ) {
    return this.alunosService.updateStatus(request.user!.id, alunoId, body);
  }
}