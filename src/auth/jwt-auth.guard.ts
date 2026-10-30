import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AccessTokenClaims, AuthUser } from './auth-user';
import { IS_PUBLIC_KEY } from './decorators';

/**
 * Global guard: every route needs a valid `Authorization: Bearer <access
 * token>` header unless it is marked @Public().
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthUser }>();
    const token = bearerToken(request);
    if (!token) {
      throw new UnauthorizedException('missing bearer token');
    }

    try {
      const claims = await this.jwt.verifyAsync<AccessTokenClaims>(token);
      request.user = {
        id: claims.sub,
        email: claims.email,
        roles: claims.roles,
      };
    } catch {
      throw new UnauthorizedException('invalid or expired access token');
    }
    return true;
  }
}

function bearerToken(request: Request): string | undefined {
  const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
  return scheme === 'Bearer' ? token : undefined;
}
