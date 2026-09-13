import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import {
  SessionAuthGuard,
  type AuthenticatedRequest,
} from '../auth/session-auth.guard.js';
import type { ConfirmMediaDto, CreateExercicioDto, ExercicioListingQuery, MediaUploadDto, UpdateExercicioDto } from './exercicio-listing.dto.js';
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

  @Get(':id')
  findOne(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.exerciciosService.findOne(request.user!.id, Number(id));
  }

  @Put(':id')
  update(@Req() request: AuthenticatedRequest, @Param('id') id: string, @Body() input: UpdateExercicioDto) {
    return this.exerciciosService.update(request.user!.id, Number(id), input);
  }

  @Delete(':id')
  remove(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.exerciciosService.remove(request.user!.id, Number(id));
  }

  @Post(':id/upload-url')
  authorizeUpload(@Req() request: AuthenticatedRequest, @Param('id') id: string, @Body() input: MediaUploadDto) {
    return this.exerciciosService.authorizeUpload(request.user!.id, Number(id), input);
  }

  @Post(':id/confirm-upload')
  confirmUpload(@Req() request: AuthenticatedRequest, @Param('id') id: string, @Body() input: ConfirmMediaDto) {
    return this.exerciciosService.confirmUpload(request.user!.id, Number(id), input);
  }

  @Get(':id/media')
  media(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.exerciciosService.media(request.user!.id, Number(id));
  }

  @Delete(':id/media/:mediaId')
  removeMedia(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('mediaId') mediaId: string,
  ) {
    return this.exerciciosService.removeMedia(request.user!.id, Number(id), Number(mediaId));
  }
}