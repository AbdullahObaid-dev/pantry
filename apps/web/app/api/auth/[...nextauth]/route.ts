import NextAuth from 'next-auth';

import { authOptions } from '@/lib/auth/options';

// NextAuth v4's factory return type is exposed as `any` here.
// The handler is immediately exported as the Next.js route handlers.
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };