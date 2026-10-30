import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { AccessTokenClaims } from './auth-user';
import { RefreshTokenStore } from './refresh-token.store';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  /** Access token lifetime in seconds. */
  expiresIn: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly refreshTokens: RefreshTokenStore,
    private readonly config: ConfigService,
  ) {}

  /** Checks the credentials and starts a new refresh token family. */
  async login(email: string, password: string): Promise<TokenPair> {
    const user = this.users.findByEmail(email);
    if (!user || !(await compare(password, user.passwordHash))) {
      throw new UnauthorizedException('invalid email or password');
    }
    return this.issueTokens(user, randomUUID());
  }

  /**
   * Rotates a refresh token: the presented token is revoked and a new pair is
   * issued in the same family. Reusing a revoked token revokes the family.
   */
  async refresh(refreshToken: string): Promise<TokenPair> {
    const record = this.refreshTokens.find(refreshToken);
    if (!record) {
      throw new UnauthorizedException('unknown refresh token');
    }
    if (record.revokedAt) {
      this.logger.warn(
        `refresh token reuse for user ${record.userId}; revoking family ${record.familyId}`,
      );
      this.refreshTokens.revokeFamily(record.familyId);
      throw new UnauthorizedException('refresh token was already used');
    }
    if (record.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('refresh token expired');
    }
    const user = this.users.findById(record.userId);
    if (!user) {
      throw new UnauthorizedException('user no longer exists');
    }

    this.refreshTokens.revoke(refreshToken);
    return this.issueTokens(user, record.familyId);
  }

  /** Ends the session: every token of the family stops working. */
  logout(refreshToken: string): void {
    const record = this.refreshTokens.find(refreshToken);
    if (record) {
      this.refreshTokens.revokeFamily(record.familyId);
    }
  }

  private async issueTokens(user: User, familyId: string): Promise<TokenPair> {
    const claims: AccessTokenClaims = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };
    const expiresIn = this.config.getOrThrow<number>(
      'auth.accessTokenTtlSeconds',
    );
    return {
      accessToken: await this.jwt.signAsync(claims, { expiresIn }),
      refreshToken: this.refreshTokens.issue(
        user.id,
        familyId,
        this.config.getOrThrow<number>('auth.refreshTokenTtlDays'),
      ),
      expiresIn,
    };
  }
}
