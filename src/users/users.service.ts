import { ConflictException, Injectable } from '@nestjs/common';
import { hash, hashSync } from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { Role, User } from './user.entity';

const BCRYPT_ROUNDS = 10;

/**
 * In-memory user store. Seeded with two demo accounts so the API can be tried
 * right away:
 *   alice@example.com / password123 (admin)
 *   bob@example.com   / password123 (member)
 */
@Injectable()
export class UsersService {
  private readonly users = new Map<string, User>();

  constructor() {
    this.seed('alice@example.com', 'Alice', ['admin']);
    this.seed('bob@example.com', 'Bob', ['member']);
  }

  findById(id: string): User | undefined {
    return this.users.get(id);
  }

  findByEmail(email: string): User | undefined {
    const normalized = email.trim().toLowerCase();
    return [...this.users.values()].find((u) => u.email === normalized);
  }

  async create(
    email: string,
    name: string,
    password: string,
    roles: Role[] = ['member'],
  ): Promise<User> {
    if (this.findByEmail(email)) {
      throw new ConflictException('email is already registered');
    }
    const user: User = {
      id: randomUUID(),
      email: email.trim().toLowerCase(),
      name,
      passwordHash: await hash(password, BCRYPT_ROUNDS),
      roles,
    };
    this.users.set(user.id, user);
    return user;
  }

  private seed(email: string, name: string, roles: Role[]): void {
    const user: User = {
      id: randomUUID(),
      email,
      name,
      passwordHash: hashSync('password123', BCRYPT_ROUNDS),
      roles,
    };
    this.users.set(user.id, user);
  }
}
