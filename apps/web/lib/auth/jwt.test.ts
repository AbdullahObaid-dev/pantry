import { jwtVerify } from 'jose';
import jsonwebtoken from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';

import { decode, encode } from './jwt';

const SECRET = 'test-secret-at-least-32-bytes-long-for-hs256-xxxxxxxxxxxxxxxxxxxx';

describe('encode', () => {
  it('produces a JWS signed with HS256, not the default encrypted JWE', async () => {
    const token = await encode({ token: { sub: 'user_1' }, secret: SECRET, maxAge: 60 });
    const [headerB64] = token.split('.');
    if (!headerB64) throw new Error('token has no header segment');
    const parsedHeader: unknown = JSON.parse(Buffer.from(headerB64, 'base64url').toString());
    if (typeof parsedHeader !== 'object' || parsedHeader === null || !('alg' in parsedHeader)) {
      throw new Error('header did not parse to an object with an alg field');
    }

    expect(parsedHeader.alg).toBe('HS256');
    // A JWE has 5 dot-separated segments; a JWS (what we want) has 3.
    expect(token.split('.')).toHaveLength(3);
  });

  it("round-trips through this module's own decode()", async () => {
    const claims = { sub: 'user_1', email: 'a@example.com', name: 'A', picture: 'https://x/y.png' };
    const token = await encode({ token: claims, secret: SECRET, maxAge: 3600 });
    const decoded = await decode({ token, secret: SECRET });

    expect(decoded?.sub).toBe(claims.sub);
    expect(decoded?.email).toBe(claims.email);
    expect(decoded?.name).toBe(claims.name);
    expect(decoded?.picture).toBe(claims.picture);
  });

  it('produces a token verifiable by jose directly (sanity check on the raw output)', async () => {
    const token = await encode({ token: { sub: 'user_1' }, secret: SECRET, maxAge: 60 });
    const { payload } = await jwtVerify(token, new TextEncoder().encode(SECRET), {
      algorithms: ['HS256'],
    });
    expect(payload.sub).toBe('user_1');
  });

  it('produces a token verifiable by jsonwebtoken — what passport-jwt uses internally on the API side', async () => {
    // This is the one property that actually matters for this stage: the two
    // apps use different JWT libraries, so it's the token FORMAT, not shared
    // code, that has to make them compatible.
    const token = await encode({
      token: { sub: 'user_1', email: 'a@example.com' },
      secret: SECRET,
      maxAge: 60,
    });
    const decoded = jsonwebtoken.verify(token, SECRET, { algorithms: ['HS256'] });
    if (typeof decoded === 'string') throw new Error('expected an object payload, got a string');
    expect(decoded.sub).toBe('user_1');
    expect(decoded.email).toBe('a@example.com');
  });

  it('sets an expiration in the future by default (30 days) when maxAge is omitted', async () => {
    const before = Math.floor(Date.now() / 1000);
    const token = await encode({ token: { sub: 'user_1' }, secret: SECRET });
    const decoded = await decode({ token, secret: SECRET });

    expect(decoded?.exp).toBeGreaterThan(before + 29 * 24 * 60 * 60);
    expect(decoded?.exp).toBeLessThanOrEqual(before + 30 * 24 * 60 * 60 + 5);
  });
});

describe('decode', () => {
  it('returns null for a token signed with the wrong secret, rather than throwing', async () => {
    const token = await encode({ token: { sub: 'user_1' }, secret: SECRET, maxAge: 60 });
    const decoded = await decode({ token, secret: 'a-completely-different-secret-value-xx' });
    expect(decoded).toBeNull();
  });

  it('returns null for a tampered token, rather than throwing', async () => {
    const token = await encode({ token: { sub: 'user_1' }, secret: SECRET, maxAge: 60 });
    const tampered = token.slice(0, -4) + 'aaaa';
    const decoded = await decode({ token: tampered, secret: SECRET });
    expect(decoded).toBeNull();
  });

  it('returns null for an expired token, rather than throwing', async () => {
    const token = await encode({ token: { sub: 'user_1' }, secret: SECRET, maxAge: -10 });
    const decoded = await decode({ token, secret: SECRET });
    expect(decoded).toBeNull();
  });

  it('returns null for an undefined token', async () => {
    const decoded = await decode({ token: undefined, secret: SECRET });
    expect(decoded).toBeNull();
  });
});