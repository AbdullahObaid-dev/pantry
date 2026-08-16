import type { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

import { decode, encode } from './jwt';

// FR-1 / SRS §11.1: Google OAuth2 sign-in/out via NextAuth, issuing a plain
// signed JWT (HS256) instead of NextAuth's default encrypted JWE — see
// jwt.ts for why and CONTRACT.md §11 for the full record.
//
// User upsert (FR-2) deliberately does NOT happen here. It happens on the
// API side, in the Passport JWT strategy's validate() (apps/api/src/auth/
// jwt.strategy.ts) — this app has no direct database access in this
// architecture (Prisma lives in apps/api only), and the SRS's own wording
// ("upserting the local User row on first sight of a given subject/email")
// describes something that happens when an authenticated request arrives,
// not something tied to the NextAuth sign-in flow itself.
export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
  ],

  session: {
    strategy: 'jwt',
  },

  jwt: {
    encode,
    decode,
  },

  callbacks: {
    // account/profile are only present on the initial sign-in call — every
    // subsequent call is just NextAuth reading the token back, so this only
    // overwrites these fields when Google has actually just supplied them.
    jwt({ token, account, profile }) {
      if (account && profile) {
        token.sub = profile.sub;
        token.email = profile.email;
        token.name = profile.name;
        token.picture = (profile as { picture?: string }).picture;
      }
      return token;
    },

    // Shapes what useSession() / getServerSession() actually return to callers.
    session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
};