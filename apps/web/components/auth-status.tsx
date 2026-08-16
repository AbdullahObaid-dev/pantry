'use client';

import { signIn, signOut, useSession } from 'next-auth/react';

// Deliberately unstyled — Tailwind/shadcn land in whichever stage builds
// real UI (see CONTRACT.md §11). This exists to manually verify the OAuth
// round trip in a browser, not as a component later stages should extend.
export function AuthStatus() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <p>Checking session…</p>;
  }

  if (session?.user) {
    return (
      <div>
        <p>
          Signed in as {session.user.email} ({session.user.id})
        </p>
        <button onClick={() => void signOut()}>Sign out</button>
      </div>
    );
  }

  return (
    <div>
      <p>Not signed in.</p>
      <button onClick={() => void signIn('google')}>Sign in with Google</button>
    </div>
  );
}
