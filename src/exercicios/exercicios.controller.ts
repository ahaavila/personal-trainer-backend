import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import {
  SessionAuthGuard,
  type AuthenticatedRequest,
} from '../auth/session-auth.guard.js';
import type { ConfirmMediaDto, CreateExercicioDto, ExercicioListingQuery, MediaUploadDto } from './exercicio-listing.dto.js';
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

  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() input: CreateExercicioDto) {
    return this.exerciciosService.create(request.user!.id, input);
  }

  @Post(':id/media/upload')
  authorizeUpload(@Req() request: AuthenticatedRequest, @Param('id') id: string, @Body() input: MediaUploadDto) {
    return this.exerciciosService.authorizeUpload(request.user!.id, Number(id), input);
  }

  @Post(':id/media/confirm')
  confirmUpload(@Req() request: AuthenticatedRequest, @Param('id') id: string, @Body() input: ConfirmMediaDto) {
    return this.exerciciosService.confirmUpload(request.user!.id, Number(id), input);
  }

  @Get(':id/media')
  media(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.exerciciosService.media(request.user!.id, Number(id));
  }
}