import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';

export interface RefreshTokenRecord {
  userId: string;
  /** All tokens descending from one login share a family. */
  familyId: string;
  expiresAt: Date;
  revokedAt?: Date;
}

/**
 * Opaque refresh tokens with rotation and reuse detection.
 *
 * Only a SHA-256 hash of each token is stored, so a leaked store cannot be
 * replayed. Every refresh revokes the presented token and issues a new one in
 * the same family; presenting an already revoked token means it was stolen
 * (or replayed), and the whole family is revoked.
 */
@Injectable()
export class RefreshTokenStore {
  private readonly records = new Map<string, RefreshTokenRecord>();

  issue(userId: string, familyId: string, ttlDays: number): string {
    const token = randomBytes(48).toString('base64url');
    this.records.set(hashToken(token), {
      userId,
      familyId,
      expiresAt: new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000),
    });
    return token;
  }

  find(token: string): RefreshTokenRecord | undefined {
    return this.records.get(hashToken(token));
  }

  revoke(token: string): void {
    const record = this.find(token);
    if (record && !record.revokedAt) {
      record.revokedAt = new Date();
    }
  }

  revokeFamily(familyId: string): void {
    const now = new Date();
    for (const record of this.records.values()) {
      if (record.familyId === familyId && !record.revokedAt) {
        record.revokedAt = now;
      }
    }
  }
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
