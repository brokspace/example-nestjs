import { Role } from '../users/user.entity';

/** The identity attached to a request by JwtAuthGuard. */
export interface AuthUser {
  id: string;
  email: string;
  roles: Role[];
}

/** Claims carried by an access token. */
export interface AccessTokenClaims {
  sub: string;
  email: string;
  roles: Role[];
}
