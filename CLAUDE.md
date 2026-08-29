# CLAUDE.md — Project Execution Rules (Read before starting work with Claude Code)

This file works together with `SPEC.md` and `tasks.md`:
- `SPEC.md` = what to build and why (user stories, acceptance criteria)
- `tasks.md` = atomic task breakdown, with how to verify each task
- `CLAUDE.md` (this file) = execution rules that apply no matter which task you're doing

**Package manager: pnpm, not npm.** This project uses pnpm exclusively (`pnpm install`, `pnpm add`, `pnpm run build`, `pnpm test`, etc). Do not run `npm install` or commit a `package-lock.json` — `tasks.md` test commands are written as `npm test -- ...` / `npm run build` for readability, but execute them as `pnpm test -- ...` / `pnpm run build`.

---

## 1. Execution Flow (follow this order for every task, do not skip steps)

For each task in `tasks.md`:

1. Read the corresponding FR entry in `SPEC.md` and confirm the acceptance criteria
2. Check for any `[NEEDS CLARIFICATION]` markers — if present, **stop and ask immediately, do not guess and proceed**
3. Only modify files within the scope assigned to this task (see SPEC.md Section 4, Scope Boundaries)
4. After implementation, run the test command specified for this task
5. **Do not commit unless all tests pass.** Fix and retry until tests pass (max 3 retries; if still failing after 3 attempts, stop and report where you're stuck — do not retry indefinitely)
6. Once tests pass, commit using the specified commit message format
7. Before committing, list the files changed in this task and confirm they are all within the allowed scope
8. Move on to the next task

## 2. The Only Definition of "Done"

A task is **not** done just because you think it's finished. It is done only when all of the following are true:
- [ ] The corresponding automated test command **passes** (not "should work" described in text)
- [ ] No files outside the task's scope were modified
- [ ] The change has been committed, with a commit message matching the required format

If some acceptance criteria cannot be covered by automated tests (e.g. semantic/logical correctness that's hard to automate), **explicitly say so** in your report — don't pretend it was tested.

## 3. Rules for Handling Uncertainty

- If `SPEC.md` contains a `[NEEDS CLARIFICATION: ...]` marker relevant to the current task, **stop and ask** — do not guess an answer and continue
- If the test command itself fails to run due to environment issues, try to resolve it yourself first (e.g. install a missing package); only ask if you can't resolve it
- If you discover a task actually requires touching another agent's/task's scope, stop and report the conflict — do not expand your own scope to force it through

## 4. Commit Conventions

- Format: `feat(FR-XXX): short description` / `fix(FR-XXX): short description` / `test(FR-XXX): short description`
- Each commit corresponds to exactly one task — do not mix multiple tasks into one commit
- Commit body should briefly note: what changed, the test command used, and the test result

## 5. Prohibited Actions

- Do not commit when tests haven't passed
- Do not claim "tests passed" without actually having run the test command
- Do not modify `SPEC.md` or `tasks.md` themselves (unless explicitly instructed to)
- Do not introduce technology/package choices outside what SPEC.md Section 3 marks as non-negotiable (e.g. don't swap out the specified API or framework)

## 6. Parallel Development Rules (when multiple Claude Code sessions work simultaneously)

If William has instructed you to work in a new git worktree, follow these rules:

- **One parallel line of work = one worktree = one branch.** Do not create a new worktree or branch for every single task — sequentially dependent tasks (e.g. T001→T002→T003) should be committed in order on the same branch, not split into separate branches
- Before starting, confirm which tasks you've been assigned (e.g. "only T001-T003") and don't proactively pick up tasks assigned to another line, even if you think you could finish them
- One task completed = one commit (see Section 4), not one branch
- **Do not perform merges back into main/other branches yourself** — this step is handled manually by William, even if you believe there are no conflicts
- If you find you need to modify a file outside your line's planned scope (which may indicate overlap with another parallel line), stop and report it — do not make the change directly

## 7. After All P1 Tasks Are Complete

Once all P1 tasks pass their tests and are committed, stop and prepare a summary for William:
- Which tasks are complete and their test results
- Any items where "tests didn't cover this, needs manual verification" (see Section 2)
- Any items that are stuck, skipped, or still have an unresolved NEEDS CLARIFICATION marker

Do not automatically continue on to P2/P3 — wait for confirmation that P1 is solid before continuing.
