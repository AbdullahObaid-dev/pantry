import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import type { JWTDecodeParams, JWTEncodeParams } from 'next-auth/jwt';

// NextAuth's default is an encrypted JWE. SRS §7.6 / §11.1 explicitly wants a
// plain *signed* JWT (HS256) instead, so a standard Passport JWT strategy on
// the NestJS side can verify it with nothing more than the shared secret —
// JWE would need the API to decrypt, not just verify, which passport-jwt
// doesn't do out of the box.
//
// jose (not jsonwebtoken) on purpose: it's already a next-auth dependency
// (no new install), and it works in the Edge runtime too, unlike
// jsonwebtoken — relevant the moment any Edge middleware wants to check a
// session without the full Node runtime. Cross-library interop with
// jsonwebtoken/passport-jwt (what the API side actually uses) was verified
// directly: a token signed here with jose was checked against a real
// passport-jwt Strategy instance and accepted — HS256 JWS is one open
// standard, not two libraries hoping to agree.

const ALG = 'HS256';

function toSecretKey(secret: JWTEncodeParams['secret']): Uint8Array {
  // NextAuth types this as string | Buffer; jose wants a Uint8Array either way.
  return typeof secret === 'string' ? new TextEncoder().encode(secret) : new Uint8Array(secret);
}

export async function encode({ token, secret, maxAge }: JWTEncodeParams): Promise<string> {
  const secretKey = toSecretKey(secret);
  // NextAuth's default session maxAge is 30 days; mirror that if it's ever
  // called without one rather than minting a token with no expiry at all.
  const expirySeconds = maxAge ?? 30 * 24 * 60 * 60;

  return new SignJWT(token ?? {})
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + expirySeconds)
    .sign(secretKey);
}

export async function decode({ token, secret }: JWTDecodeParams): Promise<JWTPayload | null> {
  if (!token) return null;
  const secretKey = toSecretKey(secret);

  try {
    const { payload } = await jwtVerify(token, secretKey, { algorithms: [ALG] });
    return payload;
  } catch {
    // Expired, tampered, wrong secret, wrong algorithm — all invalid-session
    // cases as far as NextAuth is concerned. Returning null (not throwing)
    // is the documented contract: NextAuth treats it as "no session."
    return null;
  }
}