import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service.js';

export interface AuthenticatedRequest extends Request {
  user?: { id: number; role: 'personal' | 'aluno'; name: string };
}

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = request.cookies?.session;

    if (typeof token !== 'string') {
      throw new UnauthorizedException('Invalid or expired session');
    }

    request.user = await this.authService.getAuthenticatedUser(token);
    return true;
  }
}