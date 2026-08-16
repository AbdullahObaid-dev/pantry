import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import type { PantrySessionClaims } from '@pantry/shared-types';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { PrismaService } from '../prisma/prisma.service';

function requireSharedSecret(): string {
  const secret = process.env.JWT_SHARED_SECRET;
  if (!secret) {
    // Fail loudly at startup, not with silent, hard-to-diagnose auth
    // failures on every request once traffic arrives.
    throw new Error('JWT_SHARED_SECRET is not set — see apps/api/.env.example');
  }
  return secret;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: requireSharedSecret(),
      // Pinned explicitly, not left to the library default: without this,
      // some JWT setups are vulnerable to algorithm-confusion attacks
      // (e.g. a token crafted with "alg": "none" or a mismatched
      // algorithm). Must match apps/web's encode() exactly — see
      // CONTRACT.md §11.
      algorithms: ['HS256'],
    });
  }

  async validate(payload: PantrySessionClaims) {
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Token is missing required claims');
    }

    // FR-2: upsert the local User row "on first sight" of this Google
    // subject. Implemented as an unconditional upsert on every authenticated
    // request rather than a stateful "is this really the first time" check
    // — upsert is idempotent, and re-running it keeps name/avatar in sync if
    // the person's Google profile changes. Revisit if this becomes a real
    // perf concern (e.g. cache by sub for the token's remaining lifetime).
    return await this.prisma.user.upsert({
      where: { googleId: payload.sub },
      create: {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name ?? null,
        avatarUrl: payload.picture ?? null,
      },
      update: {
        email: payload.email,
        name: payload.name ?? null,
        avatarUrl: payload.picture ?? null,
      },
    });
  }
}