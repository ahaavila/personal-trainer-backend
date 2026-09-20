import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { ForgotPasswordDto } from './forgot-password.dto.js';
import type { LoginDto } from './login.dto.js';
import { ResetPasswordDto } from './reset-password.dto.js';
import { SessionAuthGuard, type AuthenticatedRequest } from './session-auth.guard.js';
import { UpdateProfileDto } from './update-profile.dto.js';
import { ChangePasswordDto } from './change-password.dto.js';

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
      throw new BadRequestException('E-mail e senha são obrigatórios.');
    }

    const rememberMe = Boolean(credentials.rememberMe);

    const { token, role, name } = await this.authService.login(
      credentials.email,
      credentials.password,
      rememberMe,
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
      throw new UnauthorizedException('Sessão inválida ou expirada.');
    }

    return this.authService.getSession(token);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS);
    return { message: 'Logged out' };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    const result = await this.authService.forgotPassword(body.email);
    return { message: result.message };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body.token, body.password);
  }

  @Get('profile')
  @UseGuards(SessionAuthGuard)
  async getProfile(@Req() request: AuthenticatedRequest) {
    return this.authService.getProfile(request.user!.id);
  }

  @Patch('profile')
  @UseGuards(SessionAuthGuard)
  async updateProfile(
    @Req() request: AuthenticatedRequest,
    @Body() body: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(request.user!.id, body);
  }

  @Post('change-password')
  @UseGuards(SessionAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Req() request: AuthenticatedRequest,
    @Body() body: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      request.user!.id,
      body.currentPassword,
      body.newPassword,
    );
  }
}