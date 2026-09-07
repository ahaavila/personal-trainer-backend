import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import type { LoginDto } from './login.dto.js';

const SESSION_COOKIE_NAME = 'session';
const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax' as const,
  path: '/',
};

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() credentials: LoginDto = {},
    @Res({ passthrough: true }) response: Response,
  ) {
    if (
      typeof credentials.email !== 'string' ||
      typeof credentials.password !== 'string' ||
      credentials.email.length === 0 ||
      credentials.password.length === 0
    ) {
      throw new BadRequestException('Email and password are required');
    }

    const { token, role, name } = await this.authService.login(
      credentials.email,
      credentials.password,
    );

    response.cookie(SESSION_COOKIE_NAME, token, {
      ...SESSION_COOKIE_OPTIONS,
      expires: this.authService.getTokenExpiration(token),
    });

    return { role, name };
  }

  @Get('me')
  me(@Req() request: Request) {
    const token = request.cookies?.[SESSION_COOKIE_NAME];

    if (typeof token !== 'string') {
      throw new UnauthorizedException('Invalid or expired session');
    }

    return this.authService.getSession(token);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS);
    return { message: 'Logged out' };
  }
}