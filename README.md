````md
# Pantry

> **Pantry is an experimental recipe-search project currently under active development.**

The goal is to build a recipe search engine that combines lexical matching, ingredient coverage, and semantic similarity into a unified ranking system with a precise↔vibe control.

**Status: Early development — Stage 00e of 28**

Nothing here should be considered production-ready yet.

## Development Status

The project is being built incrementally from a written specification. The current foundation includes:

- Next.js frontend
- NestJS backend
- PostgreSQL + Prisma
- pnpm monorepo
- Google authentication
- JWT authentication between web and API
- Initial database schema and migrations
- Unit tests with Vitest
- GitHub Actions CI

The actual recipe ingestion, search, ranking, pantry features, and most of the UI are **not built yet**.

## Prerequisites

- Node.js 24.x — see `.nvmrc`
- pnpm 11.20.0 — managed through Corepack

## Setup

```bash
corepack enable
corepack install
pnpm install
````

## Development

Run the web and API together:

```bash
pnpm dev
```

Or run them independently:

```bash
pnpm --filter @pantry/web run dev
pnpm --filter @pantry/api run start:dev
```

The development servers run on:

* Web: `http://localhost:3000`
* API: `http://localhost:4000`

Environment variables are documented in the respective `.env.example` files.

## Checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format
```

These are also the checks currently run by CI.

## Repository Structure

```text
apps/
├── web/                 # Next.js frontend
└── api/                 # NestJS backend

packages/
└── shared-types/        # Types shared between web and API

scripts/
└── search-eval/         # Search-quality evaluation harness
```

## Development

Pantry is currently in its early implementation stages. Features will be added incrementally as development progresses.

```
```
