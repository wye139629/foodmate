# AGENT.md — Dev workflow for teammates

Read [`CLAUDE.md`](./CLAUDE.md) first — it's the actual execution ruleset (scope boundaries, commit format, when to stop and ask). This file is just the practical "how do I get running and work in parallel without stepping on others" guide.

## First-time setup

```bash
corepack enable          # if you don't have pnpm yet — this repo pins pnpm@10.16.1
pnpm install
cp .env.local.example .env.local   # ask William for the values (shared Supabase/GCP/Anthropic keys)
pnpm dev                 # http://localhost:3000
```

Run `pnpm test` to confirm your setup works before starting a task.

## Working in a git worktree (parallel dev)

We use one **worktree + branch per line of work**, per `CLAUDE.md` §6 — not per task. If your tasks are sequentially dependent (e.g. T001→T002→T003), keep them on the same branch/worktree; only spin up a new worktree for genuinely independent work.

From the main repo checkout:

```bash
git worktree add ../foodmate-<short-name> -b <branch-name>
cd ../foodmate-<short-name>
pnpm install              # node_modules is per-worktree, not shared
cp ../foodmate/.env.local .env.local   # copy from main checkout, or redo the cp+fill step above
pnpm dev
```

Branch naming follows `tasks.md`'s plan, e.g. `feature/listings`, `feature/map`, `feature/chat`. Check `tasks.md` → "Execution Order and Parallel Development Plan" for which lines are currently open and what each owns.

When done:

```bash
git push -u origin <branch-name>   # open a PR — do not merge to main yourself (CLAUDE.md §6)
```

To clean up a finished worktree (after William merges):

```bash
git worktree remove ../foodmate-<short-name>
```

## Rules that actually matter (see CLAUDE.md for full detail)

- **Before starting**: confirm which task(s) you're assigned. Don't pick up tasks outside that scope even if you could finish them.
- **Stay in your file scope**: each task in `tasks.md` lists exact files/dirs it owns. If you need to touch something outside that, stop and report — it likely means your line overlaps another's.
- **One task = one commit**, message format `feat(FR-XXX): ...` / `fix(FR-XXX): ...` / `test(FR-XXX): ...`.
- **Don't commit unless the task's test command passes.** Run it, don't assume.
- **Don't merge into main yourself** — William does that manually.
- Hit a `[NEEDS CLARIFICATION: ...]` marker in `SPEC.md`? Stop and ask, don't guess.

## Commands cheat sheet

```bash
pnpm dev                       # dev server
pnpm build && pnpm start       # production build + run
pnpm lint                      # eslint
pnpm test                      # all tests (vitest)
pnpm test -- <file>            # one test file
```

## Where things live

- `app/` — Next.js App Router pages/routes (`app/api/**` for backend routes)
- `components/` — shared UI components (`MapView`, `ListingForm`, `ChatWindow`, etc. — see `SPEC.md` §4 for ownership)
- `lib/` — shared helpers (Supabase clients, auth helpers)
- `supabase/migrations/` — DB schema, applied via Supabase CLI or the project's SQL editor
- `tests/` — vitest tests, named per the test command in each `tasks.md` entry
