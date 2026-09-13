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
@Roles('personal')
export class FichasController {
  constructor(private readonly fichasService: FichasService) {}

  @Get()
  list(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListFichasQueryDto,
  ): Promise<FichaListingDto[]> {
    return this.fichasService.list(request.user!.id, query);
  }

  @Get(':id')
  findOne(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<FichaListingDto> {
    return this.fichasService.findById(request.user!.id, id);
  }

  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() input: CreateFichaDto) {
    return this.fichasService.create(request.user!.id, input);
  }

  @Put(':id')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() input: CreateFichaDto,
  ): Promise<FichaListingDto> {
    return this.fichasService.update(request.user!.id, id, input);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.fichasService.delete(request.user!.id, id);
  }
}
