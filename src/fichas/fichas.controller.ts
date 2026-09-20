import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
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
import { CreateFichaDto } from './dto/create-ficha.dto.js';
import { FichaListingDto, ListFichasQueryDto } from './dto/list-fichas.dto.js';
import { FichasService } from './fichas.service.js';

@Controller('api/fichas-de-treino')
@UseGuards(SessionAuthGuard, RolesGuard)
export class FichasController {
  constructor(private readonly fichasService: FichasService) {}

  @Get()
  @Roles('personal', 'aluno')
  list(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListFichasQueryDto,
  ): Promise<FichaListingDto[]> {
    return this.fichasService.list(request.user!, query);
  }

  @Get(':id')
  @Roles('personal', 'aluno')
  findOne(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<FichaListingDto> {
    return this.fichasService.findById(request.user!, id);
  }

  @Post()
  @Roles('personal')
  create(@Req() request: AuthenticatedRequest, @Body() input: CreateFichaDto) {
    return this.fichasService.create(request.user!.id, input);
  }

  @Put(':id')
  @Roles('personal')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() input: CreateFichaDto,
  ): Promise<FichaListingDto> {
    return this.fichasService.update(request.user!.id, id, input);
  }

  @Delete(':id')
  @Roles('personal')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.fichasService.delete(request.user!.id, id);
  }

  @Post('solicitar-ativacao')
  @Roles('aluno')
  requestActivation(@Req() request: AuthenticatedRequest) {
    return this.fichasService.requestActivation(request.user!.id);
  }
}
