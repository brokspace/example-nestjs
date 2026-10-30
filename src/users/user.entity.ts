export type Role = 'admin' | 'member';

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  roles: Role[];
}

/** A user as returned by the API: never includes the password hash. */
export type PublicUser = Omit<User, 'passwordHash'>;

export function toPublicUser(user: User): PublicUser {
  const { id, email, name, roles } = user;
  return { id, email, name, roles };
}
