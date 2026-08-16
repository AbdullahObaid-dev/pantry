// DTOs and types shared between apps/web and apps/api.
//
// Populated incrementally as later stages lock down API contracts and the
// Prisma schema — see CONTRACT.md §6 (API contract) and §7 (data model
// contract). Whatever gets added here becomes 🔒 LOCKED per CONTRACT.md
// rule 6: later stages reference these names exactly, no silent renames.

/**
 * Claims carried in the custom-signed (HS256) session JWT — see SRS §7.6 /
 * §11.1 and CONTRACT.md §11 (Stage 00d). `apps/web`'s NextAuth `encode`
 * callback produces a token with exactly this shape; `apps/api`'s Passport
 * JWT strategy reads it back with the same shape. Field names deliberately
 * mirror the OAuth/OIDC claims Google's own ID token uses (`sub`, `email`,
 * `name`, `picture`) rather than Prisma's `User` field names (`googleId`,
 * `avatarUrl`) — the mapping between the two happens once, in the JWT
 * strategy's `validate()`, not scattered across every consumer.
 */
export interface PantrySessionClaims {
  /** Google's stable subject id for this account. Maps to `User.googleId`. */
  sub: string;
  email: string;
  name?: string | null;
  /** Google's avatar URL. Maps to `User.avatarUrl`. */
  picture?: string | null;
}