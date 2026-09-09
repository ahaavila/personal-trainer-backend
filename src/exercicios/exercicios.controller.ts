import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import {
  SessionAuthGuard,
  type AuthenticatedRequest,
} from '../auth/session-auth.guard.js';
import type { ExercicioListingQuery } from './exercicio-listing.dto.js';
import { ExerciciosService } from './exercicios.service.js';

@Controller('api/exercicios')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('personal')
export class ExerciciosController {
  constructor(private readonly exerciciosService: ExerciciosService) {}

  @Get()
  list(
    @Req() request: AuthenticatedRequest,
    @Query() query: ExercicioListingQuery,
  ) {
    return this.exerciciosService.list(request.user!.id, query);
  }
}