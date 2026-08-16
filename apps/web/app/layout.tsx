import type { Metadata } from 'next';

import { AuthSessionProvider } from '@/components/auth-session-provider';
import { AuthStatus } from '@/components/auth-status';

import './globals.css';

export const metadata: Metadata = {
  title: 'Pantry',
  description: 'Recipe search with a precise\u2194vibe hybrid ranking slider.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en">
      <body>
        <AuthSessionProvider>
          <AuthStatus />
          {children}
        </AuthSessionProvider>
      </body>
    </html>
  );
}
