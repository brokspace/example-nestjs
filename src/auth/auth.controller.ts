import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
} from '@nestjs/common';
import { toPublicUser } from '../users/user.entity';
import type { PublicUser } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import type { AuthUser } from './auth-user';
import { AuthService } from './auth.service';
import type { TokenPair } from './auth.service';
import { CurrentUser, Public } from './decorators';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() body: LoginDto): Promise<TokenPair> {
    return this.auth.login(body.email, body.password);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() body: RefreshTokenDto): Promise<TokenPair> {
    return this.auth.refresh(body.refreshToken);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Body() body: RefreshTokenDto): void {
    this.auth.logout(body.refreshToken);
  }

  @Get('me')
  me(@CurrentUser() current: AuthUser): PublicUser {
    const user = this.users.findById(current.id);
    if (!user) {
      throw new NotFoundException();
    }
    return toPublicUser(user);
  }
}
