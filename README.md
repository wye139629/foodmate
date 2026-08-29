# FoodMate

Food & ingredient sharing platform. Log in → list what you can share → see nearby shares on a map → chat with the sharer → meet up.

See [`SPEC.md`](./SPEC.md) for the full spec and [`tasks.md`](./tasks.md) for the task breakdown. [`AGENT.md`](./AGENT.md) has the day-to-day dev workflow (worktrees, commands, env vars).

## Stack

Next.js (App Router, TypeScript) · Supabase (Postgres + Auth + Realtime) · Google Maps JS API · Anthropic Claude (food photo check) · Vercel

## Getting started

**Package manager is pnpm — not npm/yarn.** Install it if you don't have it: `corepack enable` (this repo pins `pnpm@10.16.1` via `packageManager` in `package.json`).

```bash
pnpm install
cp .env.local.example .env.local   # then fill in the values, see below
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables (`.env.local`)

| Var | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project → Settings → API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase project → Settings → API |
| `SUPABASE_SECRET_KEY` | Supabase project → Settings → API |
| `SUPABASE_JWKS_URL` | Supabase project → Settings → API (JWT settings) |
| `ANTHROPIC_API_KEY` | console.anthropic.com |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | GCP project with Maps JavaScript API enabled + billing |

Ask William for shared dev credentials rather than provisioning your own Supabase/GCP project, unless you're intentionally working against an isolated instance.

`NEXT_PUBLIC_*` vars are inlined at build time — restart `pnpm dev` after changing `.env.local`.

## Common commands

```bash
pnpm dev             # start dev server (localhost:3000)
pnpm build           # production build
pnpm start           # run the production build
pnpm lint            # eslint
pnpm test            # run all tests (vitest)
pnpm test -- <file>  # run one test file, e.g. pnpm test -- chat-create.test.ts
```

## Database

Supabase migrations live in `supabase/migrations`. Apply them via the Supabase CLI or by pasting into the SQL editor of your Supabase project — ask William which is set up for this hackathon's shared project.

## Working on this repo

Read [`CLAUDE.md`](./CLAUDE.md) before starting any task — it defines the execution rules (scope boundaries, commit format, when to stop and ask). If you're using Claude Code, it's picked up automatically; read it yourself either way.

For parallel work, see [`AGENT.md`](./AGENT.md) for the git worktree workflow.
