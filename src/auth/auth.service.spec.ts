import { UnauthorizedException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import configuration from '../config/configuration';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { RefreshTokenStore } from './refresh-token.store';

describe('AuthService', () => {
  let auth: AuthService;
  let jwt: JwtService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ load: [configuration], ignoreEnvFile: true }),
        JwtModule.register({ secret: 'test-secret' }),
      ],
      providers: [AuthService, UsersService, RefreshTokenStore],
    }).compile();

    auth = moduleRef.get(AuthService);
    jwt = moduleRef.get(JwtService);
  });

  it('issues an access token carrying the user roles', async () => {
    const tokens = await auth.login('alice@example.com', 'password123');
    const claims = await jwt.verifyAsync<{ email: string; roles: string[] }>(
      tokens.accessToken,
    );
    expect(claims.email).toBe('alice@example.com');
    expect(claims.roles).toEqual(['admin']);
  });

  it('rejects a wrong password', async () => {
    await expect(
      auth.login('alice@example.com', 'not-the-password'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rotates the refresh token', async () => {
    const first = await auth.login('bob@example.com', 'password123');
    const second = await auth.refresh(first.refreshToken);
    expect(second.refreshToken).not.toBe(first.refreshToken);
    await expect(auth.refresh(second.refreshToken)).resolves.toBeDefined();
  });

  it('revokes the whole family when a used refresh token is replayed', async () => {
    const first = await auth.login('bob@example.com', 'password123');
    const second = await auth.refresh(first.refreshToken);

    await expect(auth.refresh(first.refreshToken)).rejects.toThrow(
      'refresh token was already used',
    );
    // The legitimate, newer token is revoked too.
    await expect(auth.refresh(second.refreshToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('logout revokes the session', async () => {
    const tokens = await auth.login('bob@example.com', 'password123');
    auth.logout(tokens.refreshToken);
    await expect(auth.refresh(tokens.refreshToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
