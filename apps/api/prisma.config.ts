import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Prisma ORM v7 moved connection config out of schema.prisma entirely — see
// the datasource block comment in prisma/schema.prisma and CONTRACT.md §11.
//
// Deliberately NOT using the `env()` helper here: it throws at config-load
// time if DATABASE_URL is unset, which would break `prisma generate` (and
// therefore `pnpm install`, via the postinstall hook) on a fresh clone
// before anyone has provisioned a real database. `generate` only needs a
// syntactically valid connection string, not a reachable one — the
// fallback below is never used for anything that actually touches a
// database (migrate/db push/runtime queries all require a real
// DATABASE_URL regardless).
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url:
      process.env.DATABASE_URL ??
      'postgresql://placeholder:placeholder@localhost:5432/pantry_placeholder',
  },
});
