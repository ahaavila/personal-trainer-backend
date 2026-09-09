import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { SessionAuthGuard } from '../auth/session-auth.guard.js';
import type { AuthenticatedRequest } from '../auth/session-auth.guard.js';
import { DashboardService } from './dashboard.service.js';

@Controller('api/dashboard')
@UseGuards(SessionAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('personal')
  @Roles('personal')
  personal(@Req() request: AuthenticatedRequest) {
    return this.dashboardService.getPersonalDashboard(request.user!.id);
  }

  @Get('aluno')
  @Roles('aluno')
  aluno(@Req() request: AuthenticatedRequest) {
    return this.dashboardService.getAlunoDashboard(request.user!.id);
  }
}