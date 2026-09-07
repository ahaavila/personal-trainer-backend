import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import type { LoginDto } from './login.dto.js';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() credentials: LoginDto = {}) {
    if (
      typeof credentials.email !== 'string' ||
      typeof credentials.password !== 'string' ||
      credentials.email.length === 0 ||
      credentials.password.length === 0
    ) {
      throw new BadRequestException('Email and password are required');
    }

    return this.authService.login(credentials.email, credentials.password);
  }
}