import { randomUUID } from 'crypto';

import { Injectable } from '@nestjs/common';

import { type User } from '../auth.types';

/**
 * In-memory user store for POC.
 * Replace with a database repository in production.
 */
@Injectable()
export class UserStore {
  private readonly users = new Map<string, User>();

  findByEmail(email: string): User | undefined {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return undefined;
  }

  findById(id: string): User | undefined {
    return this.users.get(id);
  }

  create(data: Omit<User, 'id' | 'createdAt'>): User {
    const user: User = {
      ...data,
      id: randomUUID(),
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  count(): number {
    return this.users.size;
  }
}
