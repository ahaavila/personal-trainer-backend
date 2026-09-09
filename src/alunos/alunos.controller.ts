import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import {
  SessionAuthGuard,
  type AuthenticatedRequest,
} from '../auth/session-auth.guard.js';
import type { AlunoListingQuery } from './aluno-listing.dto.js';
import { AlunosService } from './alunos.service.js';

@Controller('api/alunos')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('personal')
export class AlunosController {
  constructor(private readonly alunosService: AlunosService) {}

  @Get()
  list(@Req() request: AuthenticatedRequest, @Query() query: AlunoListingQuery) {
    return this.alunosService.list(request.user!.id, query);
  }
}