# Pantry

Recipe search with a precise↔vibe hybrid ranking slider (lexical + ingredient-coverage + semantic signals, fused with RRF).

**Source of truth for build status, locked decisions, and what to build next is [`CONTRACT.md`](./CONTRACT.md) — read that first, not this file.** This README only covers how to get the repo running.

## Prerequisites

- Node.js 24.x (see `.nvmrc`) — current Active LTS as of Aug 2026
- pnpm, via [Corepack](https://nodejs.org/api/corepack.html) (bundled with Node): `corepack enable`, then `corepack install` in this directory to pick up the exact pinned version from `package.json`

## Setup

```bash
pnpm install
```

## Running

```bash
pnpm dev            # web (:3000) + api (:4000) together
pnpm --filter @pantry/web run dev
pnpm --filter @pantry/api run start:dev
```

Copy `.env.example` → `.env.local` (web) / `.env` (api) in each app and fill in real values as they become needed — see `CONTRACT.md` §3 for the full checklist. Nothing needs real credentials yet at Stage 00a.

## Other workspace-wide commands

```bash
pnpm build           # fans out to every package's own build script
pnpm typecheck        # fans out to every package's own typecheck script
pnpm lint             # one ESLint pass over the whole repo
pnpm format           # one Prettier pass over the whole repo
```

## Layout

```
apps/web/             Next.js (App Router) frontend
apps/api/              NestJS backend
packages/shared-types/ DTOs shared between web and api
scripts/search-eval/   NDCG/MRR search-quality harness (Stage 06d)
```

Full structure, tech-stack decisions, and what's locked vs. still open live in `CONTRACT.md`.
