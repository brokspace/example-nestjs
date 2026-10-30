import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Role } from '../users/user.entity';
import { AuthUser } from './auth-user';
import { ROLES_KEY } from './decorators';

/** Enforces @Roles(...). Runs after JwtAuthGuard, so `request.user` is set. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required?.length) {
      return true;
    }
    const { user } = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthUser }>();
    if (!user?.roles.some((role) => required.includes(role))) {
      throw new ForbiddenException('insufficient role');
    }
    return true;
  }
}
