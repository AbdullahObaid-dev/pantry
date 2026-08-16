import { UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// This test intentionally never touches a real database. Mocking the
// module (not just constructing a fake object) matters here specifically:
// PrismaService's real implementation imports the *generated* Prisma
// client, which only exists after a successful `prisma generate` against
// this project's actual dependencies — exactly the step this sandbox can't
// run (see CONTRACT.md §11, same binaries.prisma.sh network restriction as
// Stages 00b/00c). Mocking at the module boundary means this test's
// correctness doesn't depend on that generated output existing at all.
// vi.mock() calls are hoisted above the static imports below by Vitest
// automatically -- no need for a dynamic import to sequence this by hand.
vi.mock('../prisma/prisma.service', () => ({
  PrismaService: class {},
}));

import type { PrismaService } from '../prisma/prisma.service';
import { JwtStrategy } from './jwt.strategy';

// The shape of the one Prisma call this test cares about — deliberately
// hand-defined rather than imported from Prisma's generated types (which,
// per the comment above, may not exist in every environment this test
// runs in). It only needs to match what jwt.strategy.ts actually
// constructs, which this test is exactly what's pinning down.
interface UpsertArgs {
  where: { googleId: string };
  create: { googleId: string; email: string; name: string | null; avatarUrl: string | null };
  update: { email: string; name: string | null; avatarUrl: string | null };
}

function buildStrategyDeps() {
  const upsert = vi.fn<(args: UpsertArgs) => Promise<Record<string, unknown>>>();
  upsert.mockResolvedValue({ id: 'user_1' });
  const prisma = { user: { upsert } } as unknown as PrismaService;
  return { prisma, upsert };
}

function buildStrategy() {
  const { prisma, upsert } = buildStrategyDeps();
  const strategy = new JwtStrategy(prisma);
  return { strategy, upsert };
}

describe('JwtStrategy.validate', () => {
  beforeEach(() => {
    process.env.JWT_SHARED_SECRET = 'test-secret-value-not-used-directly-by-validate';
  });

  it('upserts by googleId (mapped from the JWT sub claim), not email', async () => {
    const { strategy, upsert } = buildStrategy();

    await strategy.validate({
      sub: 'google-sub-123',
      email: 'a@example.com',
      name: 'A Name',
      picture: 'https://example.com/a.png',
    });

    expect(upsert).toHaveBeenCalledTimes(1);
    const call = upsert.mock.calls[0]?.[0];
    if (!call) throw new Error('upsert was not called');
    expect(call.where).toEqual({ googleId: 'google-sub-123' });
  });

  it('maps picture -> avatarUrl in both create and update branches', async () => {
    const { strategy, upsert } = buildStrategy();

    await strategy.validate({
      sub: 'google-sub-123',
      email: 'a@example.com',
      name: 'A Name',
      picture: 'https://example.com/a.png',
    });

    const call = upsert.mock.calls[0]?.[0];
    if (!call) throw new Error('upsert was not called');
    expect(call.create.avatarUrl).toBe('https://example.com/a.png');
    expect(call.update.avatarUrl).toBe('https://example.com/a.png');
    // Field name in the DTO is `picture` (Google's/OIDC's name); the Prisma
    // field is `avatarUrl`. Asserting there's no stray `picture` key leaking
    // into the Prisma call is exactly the kind of mismatch that's easy to
    // introduce silently and hard to notice without a test.
    expect(call.create).not.toHaveProperty('picture');
    expect(call.update).not.toHaveProperty('picture');
  });

  it('passes through email and name unchanged', async () => {
    const { strategy, upsert } = buildStrategy();

    await strategy.validate({
      sub: 'google-sub-123',
      email: 'a@example.com',
      name: 'A Name',
      picture: null,
    });

    const call = upsert.mock.calls[0]?.[0];
    if (!call) throw new Error('upsert was not called');
    expect(call.create.email).toBe('a@example.com');
    expect(call.create.name).toBe('A Name');
    expect(call.update.email).toBe('a@example.com');
    expect(call.update.name).toBe('A Name');
  });

  it('rejects a payload missing sub', async () => {
    const { strategy, upsert } = buildStrategy();
    await expect(strategy.validate({ sub: '', email: 'a@example.com' })).rejects.toThrow(
      UnauthorizedException,
    );
    expect(upsert).not.toHaveBeenCalled();
  });

  it('rejects a payload missing email', async () => {
    const { strategy, upsert } = buildStrategy();
    await expect(strategy.validate({ sub: 'google-sub-123', email: '' })).rejects.toThrow(
      UnauthorizedException,
    );
    expect(upsert).not.toHaveBeenCalled();
  });

  it('returns whatever the upserted user record is', async () => {
    const { strategy, upsert } = buildStrategy();
    upsert.mockResolvedValue({ id: 'user_42', email: 'a@example.com' });

    const result = await strategy.validate({ sub: 'google-sub-123', email: 'a@example.com' });
    expect(result).toEqual({ id: 'user_42', email: 'a@example.com' });
  });
});

describe('JwtStrategy construction', () => {
  it('throws immediately if JWT_SHARED_SECRET is not set, instead of failing silently later', () => {
    delete process.env.JWT_SHARED_SECRET;
    const { prisma } = buildStrategyDeps();
    expect(() => new JwtStrategy(prisma)).toThrow(/JWT_SHARED_SECRET/);
  });
});