import type { DefaultSession } from 'next-auth';
import type { DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    // Set from the Google OAuth profile on first sign-in (see options.ts).
    // Matches @pantry/shared-types' PantrySessionClaims -- same fields,
    // kept as a separate augmentation because this one extends NextAuth's
    // own JWT type rather than standing alone.
    sub?: string;
    picture?: string | null;
  }
}