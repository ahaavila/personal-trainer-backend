import {
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import {
  SessionAuthGuard,
  type AuthenticatedRequest,
} from '../auth/session-auth.guard.js';
import { SubscriptionService } from './subscription.service.js';

@Controller('api/subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('status')
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('personal')
  getStatus(@Req() request: AuthenticatedRequest) {
    return this.subscriptionService.getStatus(request.user!.id);
  }

  @Post('checkout')
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('personal')
  @HttpCode(HttpStatus.OK)
  createCheckoutSession(@Req() request: AuthenticatedRequest) {
    return this.subscriptionService.createCheckoutSession(request.user!.id);
  }

  @Post('portal')
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('personal')
  @HttpCode(HttpStatus.OK)
  createPortalSession(@Req() request: AuthenticatedRequest) {
    return this.subscriptionService.createPortalSession(request.user!.id);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() request: Request,
    @Headers('stripe-signature') signature: string,
  ) {
    let rawBody: Buffer;

    if ((request as any).rawBody && Buffer.isBuffer((request as any).rawBody)) {
      rawBody = (request as any).rawBody;
    } else if (Buffer.isBuffer(request.body)) {
      rawBody = request.body;
    } else if (typeof request.body === 'string') {
      rawBody = Buffer.from(request.body, 'utf8');
    } else {
      rawBody = Buffer.from(JSON.stringify(request.body || {}), 'utf8');
    }

    return this.subscriptionService.handleWebhook(rawBody, signature);
  }
}
