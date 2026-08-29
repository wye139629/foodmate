# tasks.md — FoodMate (Atomic Task Breakdown)

> Maps to `SPEC_food_sharing.md`. Every task must follow the execution flow in `CLAUDE.md`: implement → run tests → commit only if passing.
> `CLAUDE.md` is a shared file — no need to rewrite it, just place it in this project's root.

---

## T000｜Project Initialization (prerequisite, not tied to a specific FR)

- **What**: Scaffold Next.js (App Router, TypeScript) project (project/package name set to `foodmate`), set up Supabase connection and schema (`users` — built-in Supabase Auth, `listings`: name/description/photo URL/lat-lng/status/owner_id, `chats`: both user_ids, `messages`: chat_id/sender_id/content/created_at), enable Supabase Realtime on the `messages` table, set up `.env.example` (including a Google Maps API key field), set up a test framework, set app title/metadata to "FoodMate"
- **File scope**: Root config files, `/app/layout.tsx`, `.env.example`, Supabase schema migration file
- **Test command**: `npm run build`
- **Commit message**: `chore: project init and Supabase schema setup`
- **Rollback**: `git reset --hard` back to before the init commit

---

## T001｜FR-001 User Login

- **Prerequisite**: T000 complete
- **What**:
  - Build the register/login page, integrated with Supabase Auth
  - Build middleware / a route guard ensuring non-logged-in users cannot access identity-required pages (create listing, chat, map)
- **File scope**: `/app/login/page.tsx`, `/app/signup/page.tsx`, `/middleware.ts`, `/lib/supabase-auth.ts`
- **Test command**: `npm test -- auth.test.ts` (verify a non-logged-in user hitting a protected route is redirected to login; verify a logged-in user can access it normally)
- **Acceptance mapping**: SPEC_food_sharing.md FR-001, Acceptance Overview "non-logged-in users must not be able to access"
- **Commit message**: `feat(FR-001): user login and route protection`
- **Rollback**: `git revert <commit-hash>`

---

## T002｜FR-002 Set Up What You Can Share (can be developed in parallel with T003 — see plan below)

- **Prerequisite**: T001 complete
- **What**:
  - Build the listing form component (name, quantity description, optional photo upload, auto-fill current lat/lng)
  - Create `/app/api/listings` POST route: saves the listing to the `listings` table, tied to the logged-in user's id, defaulting status to "available"; requires auth (this route is not covered by middleware's page matcher, so it must check the session itself)
  - Add a Supabase Storage bucket for listing photos (migration)
- **File scope**: `/components/ListingForm.tsx`, `/app/listings/new/page.tsx`, `/app/api/listings/route.ts`, `supabase/migrations/*_listing_photos_bucket.sql`
- **Test commands**:
  - `pnpm test -- listing-create.test.ts` (verify form submission correctly calls the API; verify the API correctly writes to the database with owner_id set; verify error handling when lat/lng is missing; verify an unauthenticated request is rejected)
- **Acceptance mapping**: SPEC.md FR-002
- **Commit message**: `feat(FR-002): set up shareable listing`
- **Rollback**: `git revert <commit-hash>`

> **Revision (William, 2026-08-29):** T002 originally included an AI-assisted fridge-scan flow (FR-002b: photo → candidate item list → batch-create listings). It was built, then removed entirely at William's request in favor of Trust & Safety work (see T011/T012 below) — `FridgeScanner.tsx`, `/api/listings/scan`, and its tests are deleted, not just hidden.

---

## T003｜FR-003 Map Showing Nearby Shareable Items

- **Prerequisite**: T001 complete (no dependency on T002's form UI — only needs the `listings` table structure, so it can be developed in parallel using mock data)
- **What**:
  - Integrate the Google Maps JavaScript API, display the map, and get the user's current location (browser Geolocation API), fetched live every time the map opens
  - Create `/app/api/listings/nearby` route: takes the user's lat/lng and a `radiusKm` query param, uses the Haversine formula to compute distance, returns "available" listings within range (default `radiusKm=10` if omitted)
  - Add a radius selector on the map page (5 / 10 / 25 / 50 km presets, default 10 km — pulled forward from FR-007 at William's request) that re-queries on change
  - Show item markers on the map; clicking a marker shows its details
- **File scope**: `/components/MapView.tsx`, `/app/api/listings/nearby/route.ts`, `/lib/geo-distance.ts`, `/app/map/page.tsx`
- **Test commands**:
  - `pnpm test -- geo-distance.test.ts` (verify the Haversine distance formula's correctness against known lat/lng pairs with known reference distances)
  - `pnpm test -- nearby-listings.test.ts` (mock the database returning multiple listings at various distances, verify the API correctly includes in-range items and excludes out-of-range ones for a given radius; verify the default radius applies when omitted; verify an unauthenticated request is rejected)
- **Acceptance mapping**: SPEC_food_sharing.md FR-003, Acceptance Overview "map markers must correspond to real lat/lng data"
- **Commit message**: `feat(FR-003): map showing nearby shareable listings`
- **Rollback**: `git revert <commit-hash>`

> **Revision (William, 2026-08-29):** refined against a second Figma reference (node 8:291). Adds a real category filter (pulls another slice of FR-007 forward, same reasoning as the radius selector): `category` column on `listings` (nullable, one of Korean/Italian/Chinese/Western/Mexican/Thai/Dessert/Other), a picker on `ListingForm.tsx`, `category` query param on `/api/listings/nearby`, and a filter pill row on the map. Markers become rotated photo-thumbnail cards instead of icon bubbles; "Share Food" moves to bottom-right. File scope extends to `supabase/migrations/*_listings_category.sql` and `/components/ListingForm.tsx` (extend, do not rewrite).

> **Revision (William, 2026-08-29):** marker click now opens a bottom-sheet modal listing every item at that marker's coordinate (replacing the Google Maps `InfoWindow`), and tapping an item navigates to a new `/app/listings/[id]/page.tsx` detail page — matching a pasted Figma Make reference. Deferred from the reference: "Bowl Rating" (completed shares/feedback tags) and "Food Identity" (roots/home/specialties/curious from onboarding), since neither is backed by real data yet; the detail page uses only what we collect today (photo/name/description/category/recommend score, sharer display name + `profiles.created_at`). Adds `/components/BackButton.tsx` (shared chevron-back button, also now used by `ListingForm.tsx`) and `/app/listings/[id]/page.tsx`. File scope extends to `/components/MapView.tsx` (extend), `/components/BackButton.tsx` (new), `/app/listings/[id]/page.tsx` (new), `/components/ListingForm.tsx` (extend, do not rewrite).

---

## T004｜FR-004 1-on-1 Chat Request

- **Prerequisite**: T001 complete (no dependency on T002/T003 — can be developed in parallel, since chat logic is decoupled from listing/map logic and only needs a listing_id and owner_id as parameters to initiate)
- **What**:
  - Build the "Contact the sharer" button logic: if no chat exists yet between this user and the owner, create a `chats` record; if one exists, open it
  - Build the chat room UI, subscribing to Supabase Realtime for new-row events on the `messages` table, showing new messages live
  - Create `/app/api/chat/send` route: writes a message
- **File scope**: `/components/ChatWindow.tsx`, `/app/api/chat/**`
- **Test commands**:
  - `npm test -- chat-create.test.ts` (verify repeated clicks on "Contact the sharer" don't create duplicate chat rooms — it should reopen the existing one)
  - `npm test -- chat-realtime.test.ts` (verify that after a message is written, the subscribing side receives the update event — can use a Supabase local emulator or mock to verify the subscription logic fires correctly)
- **Acceptance mapping**: SPEC_food_sharing.md FR-004, Acceptance Overview "chat messages must update in real time"
- **Commit message**: `feat(FR-004): 1-on-1 chat feature`
- **Rollback**: `git revert <commit-hash>`

> **Revision (William, 2026-08-29):** built the missing `/chat` list page (`/app/chat/page.tsx`) — BottomNav's "Chats" tab linked to `/chat`, which had no page, only `/chat/new` and `/chat/[chatId]`. Lists every chat the user is in with the other person's name, a last-message preview (or "Say hello to get started." if none), and relative time, sorted most-recent-first. While testing it, found `/api/chat/open` had a real race — a double-fired request could create two chat rows for the same pair before either insert landed. Fixed with a unique index on `least/greatest(user_id_1, user_id_2)` (`supabase/migrations/*_chats_unique_pair.sql`) and a 23505-conflict recovery path in the route that refetches the winner. Also extracted `timeAgo()` (previously duplicated inline in `MapView.tsx`) to `/lib/time-ago.ts`, now shared by both. File scope: `/app/chat/page.tsx` (new), `/app/api/chat/open/route.ts` (extend), `/lib/time-ago.ts` (new), `/components/MapView.tsx` (extend, do not rewrite), `supabase/migrations/*_chats_unique_pair.sql` (new).
> **Test command**: `pnpm test -- chat-create.test.ts` (added a case covering the 23505 race-recovery path)

---

## T005｜FR-005 Mark Meetup as Complete (integrates T002, T003, T004)

- **Prerequisite**: T002, T003, and T004 complete and merged into the same line
- **What**:
  - Build a "mark exchange complete" button (owner only), updates `listings` status
  - Map and list views reflect the status change live (completed items disappear from the "available" list)
  - Chat room shows a status update notice
- **File scope**: `/app/api/listings/complete/route.ts`, `/components/ListingCard.tsx` (extend only, do not rewrite), `/components/ChatWindow.tsx` (extend the status notice, do not rewrite)
- **Test command**: `npm test -- listing-complete.test.ts` (verify a non-owner calling this API is rejected; verify that after the status update, `nearby-listings` no longer returns this listing)
- **Acceptance mapping**: SPEC_food_sharing.md FR-005, Acceptance Overview "listing status changes must be correctly reflected"
- **Commit message**: `feat(FR-005): mark meetup as complete`
- **Rollback**: `git revert <commit-hash>`

---

## T011｜FR-011 Safety-First Onboarding

- **Prerequisite**: T001 complete
- **What**:
  - Track onboarding completion per user via Supabase Auth's `user_metadata` (`onboarded: true`) — no new table needed
  - Build `/app/onboarding/page.tsx`: safety guidelines + community rules, with an explicit acknowledgment action that sets the flag and redirects onward
  - Extend middleware: a logged-in but not-yet-onboarded user hitting any protected path (`/map`, `/listings`, `/chat`, `/board`) is redirected to `/onboarding` first, instead of straight through
- **File scope**: `/app/onboarding/page.tsx`, `/middleware.ts`, `/lib/supabase-auth.ts` (extend, do not rewrite)
- **Test command**: `pnpm test -- onboarding.test.ts` (verify a logged-in, non-onboarded user hitting a protected route is redirected to `/onboarding`; verify an onboarded user is not redirected; verify `/onboarding` itself doesn't redirect-loop)
- **Acceptance mapping**: SPEC.md FR-011
- **Commit message**: `feat(FR-011): safety-first onboarding flow`
- **Rollback**: `git revert <commit-hash>`

## T012｜FR-012 AI Food Quality Check

- **Prerequisite**: T002 complete
- **What**:
  - Create `/app/api/listings/check-photo` POST route (auth-checked): sends the photo to Claude (`claude-opus-5`, vision + structured outputs via Zod) and returns whether it looks safe to share plus a reason when it doesn't
  - Wire into `ListingForm.tsx`: when a photo is attached, run the check before creating the listing; a flagged photo blocks submission and shows the reason instead of silently failing or letting it through
- **File scope**: `/app/api/listings/check-photo/route.ts`, `/components/ListingForm.tsx` (extend, do not rewrite)
- **Test command**: `pnpm test -- listing-quality-check.test.ts` (mock the Anthropic client; verify a flagged photo blocks with a reason; verify a clean photo passes; verify an unauthenticated request is rejected)
- **Acceptance mapping**: SPEC.md FR-012
- **Commit message**: `feat(FR-012): AI food quality check gates listing creation`
- **Rollback**: `git revert <commit-hash>`

> **Revision (William, 2026-08-29):** superseded by T013 below — `/app/api/listings/check-photo` is deleted and its safety check folded into `/app/api/listings` POST itself, alongside the new recommend score, as a single Claude call. See T013 for why.

## T013｜FR-013 AI Recommend Score

- **Prerequisite**: T012 complete
- **What**:
  - Consolidate photo analysis into `/app/api/listings` POST itself (delete `/app/api/listings/check-photo`): when a `photoUrl` is present, fetch it server-side and run one Claude call (vision + structured outputs via Zod) returning both the FR-012 safety verdict and a 0–10 recommend score + one-line reason. Computing this server-side from the already-uploaded photo — not accepting a client-supplied score — matters because the score is public, so a client-supplied value could be faked as a trust signal.
  - Unsafe → 400, same as before, listing not created. Safe → listing is created with `recommend_score`/`recommend_reason` set; no photo → both stay null.
  - Schema: add `recommend_score` (smallint, 0–10) and `recommend_reason` (text) to `listings`.
  - Surface the score publicly: `/api/listings/nearby` already returns it (`select("*")`); show it on `MapView.tsx`'s marker InfoWindow and on `app/board/page.tsx`'s "Just Shared" cards (extend, do not rewrite — that page is owned by a parallel work stream).
  - Restyle `ListingForm.tsx` / `app/listings/new/page.tsx` to the "Share Food" layout (photo tap-area, Item Name, Category, Story/Description, Publish button, back button), keeping the real Supabase-backed submit logic.
- **File scope**: `/app/api/listings/route.ts` (rewrite), `/app/api/listings/check-photo/*` (delete), `/components/ListingForm.tsx` (rewrite), `/app/listings/new/page.tsx` (rewrite), `/components/MapView.tsx` (extend), `/app/board/page.tsx` (extend), `/supabase/migrations/*_listings_recommend_score.sql`
- **Test command**: `pnpm test -- listing-create.test.ts` (mock the Anthropic client and photo fetch; verify a flagged photo still blocks with a reason and writes nothing; verify a safe photo stores the score; verify no-photo listings store a null score; verify an Anthropic failure returns a clean error)
- **Acceptance mapping**: SPEC.md FR-013
- **Commit message**: `feat(FR-013): AI recommend score shown publicly on listings`
- **Rollback**: `git revert <commit-hash>`

---

## P2 Tasks (only start after all P1 is done and William confirms)

## T006｜FR-006 Safety Notice Display
- **Prerequisite**: T004, T005 complete
- **Test command**: `npm test -- safety-notice.test.tsx`
- **Commit message**: `feat(FR-006): safety notice display`

## T007｜FR-007 Listing Filter/Category
- **Prerequisite**: T003 complete
- **Test command**: `npm test -- listing-filter.test.ts`
- **Commit message**: `feat(FR-007): listing filter feature`

---

## Execution Order and Parallel Development Plan

```
T000 (must be first)
  ├── T001 (login — common prerequisite for all other tasks)
  │
  ├── worktree A (branch: feature/listings)
  │     T002 (listing creation form)
  │
  ├── worktree B (branch: feature/map)
  │     T003 (map display — can start with mock data, doesn't wait for T002)
  │
  ├── worktree C (branch: feature/chat)
  │     T004 (chat — only needs listing_id/owner_id parameters, can be developed in parallel)
  │
  └── T005 (needs A, B, and C all merged into main, done on main)
```

**Important**: before T003 and T004 start, the `listings` table's field format (id, name, lat, lng, status, owner_id) must be locked down in T000 and shared with all three lines' agents — do not let each line decide the format independently, or T005's integration won't line up.

## Manual Verification Checklist After P1 Is Complete (see CLAUDE.md Section 7)

Once all T000-T005 tests pass and are merged into main, William must prepare **two test accounts** and personally run one complete happy path:
1. Account A logs in → creates a shareable listing (with a real, testable lat/lng)
2. Account B logs in → opens the map, confirms Account A's listing marker is visible → clicks "Contact the sharer" to start a chat → sends a message, confirms Account A receives it in real time
3. Account A marks the listing as complete → confirms it disappears from the map and the chat shows the status notice
4. Confirm the full flow also works on the Vercel deployment (not just localhost) — pay special attention to whether the Google Maps API key's domain authorization is set correctly for production
