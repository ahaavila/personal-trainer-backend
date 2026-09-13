import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import {
  SessionAuthGuard,
  type AuthenticatedRequest,
} from '../auth/session-auth.guard.js';
import { CreateFichaDto } from './dto/create-ficha.dto.js';
import { FichasService } from './fichas.service.js';

@Controller('api/fichas-de-treino')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('personal')
export class FichasController {
  constructor(private readonly fichasService: FichasService) {}

  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() input: CreateFichaDto) {
    return this.fichasService.create(request.user!.id, input);
  }
}
