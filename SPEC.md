# SPEC.md — FoodMate (Food & Ingredient Sharing Platform)

> This is the single source of truth every AI agent (planner / builder / reviewer) must read before starting work.
> If anything is ambiguous, the agent should mark it `[NEEDS CLARIFICATION: ...]` and stop to ask, rather than guessing.

---

## 1. Context

Project name: **FoodMate**
Hackathon theme: Food or Ingredients Sharing.
Users can list food/ingredients they're willing to share. The system shows nearby shareable items on a map. Users coordinate pickup via 1-on-1 chat, and finally meet up to complete the exchange. Core flow: set up what you can share → browse nearby items on a map → chat to coordinate → meet and share.

## 2. Goal

Build an MVP that runs end-to-end for the demo:
User logs in → creates a shareable food listing (with location) → another user sees the nearby listing on the map → initiates a 1-on-1 chat request → both parties coordinate a meetup → mark the exchange as complete.

## 3. Tech Stack (locked in — agents must not change this)

| Item | Choice | Reason |
|---|---|---|
| Full-stack framework | Next.js (App Router, TypeScript) | Shares the same skeleton as the other candidate projects |
| Database / Auth | Supabase (Postgres + Auth + Realtime) | Real user identity is required for chat and meetups — Auth is mandatory here, not optional |
| Realtime chat | Supabase Realtime (Postgres change subscriptions) | No extra WebSocket service needed, consistent with the existing stack |
| Map | Google Maps JavaScript API | Displays nearby shareable items, gets the user's current location |
| AI food quality check + recommend score | Anthropic Claude API (`claude-opus-5`, vision + structured outputs) | One call checks a listing photo for visible spoilage (hard block, FR-012) and scores freshness/effort 0–10 for public display (informational, FR-013) — trust & safety, not a convenience feature |
| Deployment | Vercel | git push auto-deploys |

**Non-negotiable rules (constitution-level, agents must not violate):**
- Creating a listing, initiating chat, and viewing the map **all require login** (unlike the other candidate projects, this one must NOT be usable anonymously)
- Location calculations **must not use PostGIS or complex geo-queries** — for the MVP, use a simple lat/lng distance formula (Haversine) computed at the application layer; do not introduce an additional geo-database package
- Any screen involving a real-world meetup **must display a safety notice** (recommend meeting in a public place, confirm the other party beforehand) — this is a required UI element, not optional
- No payment/monetary transaction feature (this is pure sharing, not a marketplace)
- Trust & Safety is a P1 pillar, not a nice-to-have: every new user must complete onboarding (safety guidelines + community rules) before creating a listing, chatting, or browsing the map. When a listing includes a photo, it must pass an AI food-quality check before the listing is created (photo remains optional per FR-002 — no photo means no check to run)

## 4. Scope Boundaries (to prevent agents from stepping on each other's files)

| Agent Role | Owns | Must Not Touch |
|---|---|---|
| Auth/Backend agent | `/app/api/**`, Supabase schema (users, listings, chats, messages tables), Auth setup | UI component files |
| Map/Listing agent | `/components/MapView.tsx`, `/components/ListingForm.tsx`, `/components/ListingCard.tsx`, corresponding `/app/api/listings/**` | Chat-related files |
| Chat agent | `/components/ChatWindow.tsx`, `/app/api/chat/**`, Supabase Realtime subscription logic | Map/Listing-related files |
| Reviewer agent | Verifies Acceptance Criteria against this document | Cannot modify functionality outside scope |

## 5. User Stories (MVP, with priority)

### P1 — Must-have (the demo skeleton)

**FR-001｜User login**
- **Given** the user opens the app for the first time
- **When** the user registers/logs in via email/password (or another simple Supabase-supported login method)
- **Then** the system creates/identifies that user's identity, and all subsequent actions (creating a listing, chatting) are tied to it

**FR-002｜Set up what you can share**
- **Given** the user is logged in
- **When** the user fills in the food/ingredient they want to share (name, quantity description, optional photo, location) and submits
- **Then** the system saves this listing to the database, marks it as "available", and ties it to the location the user confirmed
- **Note:** location is device GPS by default, shown as a draggable pin on a small map in the form — the user can adjust it before publishing rather than the exact device coordinate being used silently. This matters for trust & safety (an unadjusted exact GPS reading can pin a listing to someone's precise home location) as much as for correcting a bad fix (e.g. indoors).

**FR-003｜Map showing nearby shareable items**
- **Given** the user is logged in and has granted browser location access
- **When** the user opens the map page
- **Then** Google Maps shows markers, centered on the user's current location, for all "available" listings nearby — clicking a marker opens a bottom-sheet listing every item at that marker's location; tapping an item navigates to that listing's detail page (`/listings/[id]`), showing photo, name, description, category, recommend score if present, and the sharer's name/avatar/member-since, with a Chat button (or "This is your listing" if it's the viewer's own)
- **Also**: a category filter row (Korean / Italian / Chinese / Western / Mexican / Thai / Dessert / Other, plus "All") narrows the markers and the listing strip to that category — this pulls a slice of FR-007 (P2, listing filter) forward at William's request, same as the radius selector. `category` is optional on a listing; uncategorized listings only show under "All".

**FR-004｜1-on-1 chat request**
- **Given** the user sees a listing of interest on the map or in a list
- **When** the user clicks "Contact the sharer"
- **Then** the system creates (or opens an existing) 1-on-1 chat room between that user and the sharer, and both can exchange messages in real time (via Supabase Realtime)
- **Also**: a `/chat` list page shows every chat the user is part of (other person, last message preview, relative time), sorted most-recent-first, fixing the bottom nav's "Chats" tab which previously 404'd (it links to `/chat`, not `/chat/new` or `/chat/[chatId]`, neither of which is a list).

**FR-005｜Mark meetup as complete**
- **Given** both parties have coordinated in chat
- **When** the sharer (listing owner) marks the listing as "exchange complete"
- **Then** the listing is removed from the "available" list on the map, its status updates to complete, and both parties see a status update notice in the chat

**FR-011｜Safety-first onboarding**
- **Given** a user has just signed up (or logs in for the first time without having completed it)
- **When** they try to reach any identity-required page (map, listing creation, chat)
- **Then** they're routed through a one-time onboarding flow first — safety guidelines (meet in public, verify the other party) and community rules, with explicit acknowledgment — before landing on the page they wanted; completion is remembered so it never shows again for that user

**FR-012｜AI food quality check**
- **Given** a user is creating a listing and has attached a photo
- **When** they submit the form
- **Then** the photo is sent to Claude (vision + structured outputs) to check for visible spoilage/quality issues before the listing is written to the database — a flagged photo blocks submission with a clear reason instead of creating the listing

**FR-013｜AI recommend score**
- **Given** a user is creating a listing and has attached a photo that passes the FR-012 safety gate
- **When** the listing is created
- **Then** the same Claude call additionally scores the listing 0–10 based on how fresh the food looks in the photo and how much effort the description shows, stores the score with the listing, and shows it publicly on that listing's map marker/InfoWindow and board card so other users see it as a trust signal
- **Note:** this is informational only — a low score never blocks publishing (unlike FR-012's hard block). No photo → no score (`recommend_score` stays null). The score is computed server-side from the already-uploaded photo, never accepted as client input, so a user can't fake their own listing's public trust score.

**FR-014｜Profile page**
- **Given** a logged-in user taps the avatar in the top-right corner of the map, board, or chat-list header
- **When** the page loads
- **Then** they see a profile page — their name/avatar, "Member since", counts of their own Active vs. Shared listings, a "+ Share something new" shortcut, and their own listings split into Available (tap through to the real listing detail page) and Shared sections, plus a Log out action
- **Note:** the board page's avatar previously logged the user out directly on tap — that's moved to an explicit Log out button on this new page instead.

### P2 — Do if time allows

**FR-006｜Safety notice display**
- **Given** the user enters the chat room or is about to mark a meetup
- **When** meetup-related information is shown on screen
- **Then** display a clear safety notice (recommend meeting in public, verify the other party's identity beforehand)

**FR-007｜Listing filter/category**
- **Given** the user is on the map/list page
- **When** the user selects a filter (e.g. ingredient category, distance range)
- **Then** the screen shows only listings matching that filter

### P3 — Nice to have

**FR-008** User rating/reputation records (rate each other after a completed exchange)
**FR-009** Listing expiration time (freshness reminder)
**FR-010** Save/follow listings of interest

## 6. Acceptance Criteria Overview (for the reviewer agent)

- [ ] FR-001~005, FR-011, FR-012 all passing = demo-ready (minimum showable bar)
- [ ] Non-logged-in users must not be able to access listing creation, chat, or contact info (must redirect clearly to the login page — not a blank screen or error)
- [ ] A user who hasn't completed onboarding must not be able to reach the map, listing creation, or chat — redirected to onboarding first
- [ ] A listing photo showing visible spoilage must not be allowed to create a listing
- [ ] Map markers must correspond to real latitude/longitude data — no hardcoded fake data on the map
- [ ] Chat messages must update in real time (the recipient sees a new message without refreshing the page) — must be verified with an actual test of the Supabase Realtime subscription
- [ ] Listing status changes (available → complete) must be correctly reflected on the map and for both users

## 7. Open Questions (must be resolved before implementation)

- [RESOLVED] Google Maps API key: obtained, wired into `.env.local` / Vercel as `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
- [RESOLVED] Anthropic API key (now powering FR-012's food quality check): obtained, wired into `.env.local` / Vercel as `ANTHROPIC_API_KEY` (server-only, not `NEXT_PUBLIC_`).
- [RESOLVED] User location: fetched live via the browser Geolocation API every time the map opens (no stored/fixed profile location).
- [RESOLVED] Map browsing position (William, 2026-08-29): switched from `watchPosition` (continuous) to a one-shot `getCurrentPosition()` per map visit. `watchPosition` fires repeatedly on real devices from GPS jitter alone, which was cascading into a listings refetch + full marker rebuild every few seconds — the root cause of a bug where the item-detail sheet could close itself out from under a user mid-tap. A single fetch per visit (already the map's existing "every time the map opens" behavior, since `active` toggles on each tab visit) is sufficient for a "browse nearby food" use case and removes the churn entirely.
- [RESOLVED] Listing location capture (William, 2026-08-29): creating a listing no longer silently uses the device's exact GPS reading. A `LocationPicker` shows a small draggable-pin map (seeded from `getCurrentPosition()`, one-shot) so the user confirms or adjusts the point before publishing — addresses both a real trust & safety gap (exact home GPS otherwise becomes the public listing location) and bad fixes (e.g. indoors). The Google Maps loader (script injection + readiness polling) was extracted from `MapView.tsx` into `/lib/google-maps-loader.ts` so both it and the new picker share one implementation.
- [RESOLVED] Chat notifications: none for P1 — no unread badge/alert. Messages still update live within an open chat via Supabase Realtime; the user checks the chat room manually otherwise.
- [RESOLVED] "Nearby" distance: user-selectable radius (a control on the map page — 5 / 10 / 25 / 50 km presets, default 10 km), rather than one fixed threshold. This pulls a slice of FR-007 (P2, distance filter) forward into FR-003 at William's request. Test accounts/mock data with a realistic spread still need to be prepared before the demo.
- [RESOLVED] FR-002b (AI-assisted fridge scan / batch listing creation) is removed entirely per William's request — code, tests, and the FR itself. The Anthropic integration is repurposed for FR-012's food quality check instead of being dropped.
- [RESOLVED] FR-011 onboarding scope: safety guidelines + community rules acknowledgment, gating all identity-required pages until completed. Not identity verification, phone number, or other deeper trust mechanisms — those stay out of scope unless raised later.
- [RESOLVED] FR-012 food quality check: gates listing creation (blocks submission on a flagged photo) rather than being advisory-only. Only runs when a photo is attached — photo stays optional per FR-002.
- [RESOLVED] FR-013 recommend score (William, 2026-08-29): keeps FR-012's hard block unchanged and adds a score alongside it (not a replacement); score is shown publicly on map/board listing cards (not sharer-only); a low score is informational only and never blocks publishing.
- [RESOLVED] FR-003 marker interaction (William, 2026-08-29): replaced the Google Maps InfoWindow with a custom bottom-sheet modal + a real listing detail page (`/listings/[id]`), matching a pasted Figma Make reference. The reference's "Bowl Rating" (completed shares/feedback tags) and "Food Identity" (roots/home/specialties/curious, from onboarding) sections are deferred — William chose the basic version using data we actually collect (photo/name/description/category/score/sharer name & member-since) rather than adding new onboarding fields and trust-tracking schema right now.
- [RESOLVED] FR-004 chat list (William, 2026-08-29): built the missing `/chat` list page rather than also restyling the individual chat window in this pass (kept as a separate, deferred option). While testing it, found and fixed a real race condition in `/api/chat/open` — a double-fired request (React StrictMode in dev, or any concurrent retry) could create two duplicate chat rows for the same pair of users, since the "does a chat exist" check and the insert weren't atomic. Fixed with a DB-level unique index on the (unordered) user pair plus a 23505-conflict recovery path that refetches the winner instead of erroring.
- [RESOLVED] FR-004 chat window restyle (William, 2026-08-29): restyled `/app/chat/[chatId]/page.tsx` and `ChatWindow.tsx` to match the design system (own vs. other message bubbles, header showing the other participant's name/avatar, styled safety note, auto-scroll to newest message) — no Figma reference was provided for this one, styled to match the established look from the map/board/listing-detail pages instead.
- [RESOLVED] FR-004 chat window restyle v2 (William, 2026-08-29): restyled again against a pasted reference screenshot + `design.md` (warm retro-editorial, restrained neo-brutalism — thinner borders, flatter secondary surfaces, hard shadows only on emphasized elements). The reference also showed a listing-summary card and a "Rating — N shares / tags" trust card in the chat header. Built the listing-summary card for real: added `chats.listing_id` (set when a chat is opened from a listing's Chat button, backfilled on reopen if missing) so the header can show that listing's real name/photo/status. Skipped the Rating/tags card — same reasoning as the listing-detail page's deferred "Bowl Rating": no completed-shares/feedback-tag tracking exists, and William chose not to fabricate placeholder data for it.

## 8. Definition of Done (termination condition for agents)

A task is considered "done" only when:
1. Its Given-When-Then acceptance criteria have actually been tested and passed (not just claimed by the agent)
2. It has not exceeded that agent's Scope Boundary
3. The reviewer agent or William personally has confirmed one manual happy-path run (using at least two test accounts to simulate "sharer creates a listing" and "requester finds it on the map and chats")
