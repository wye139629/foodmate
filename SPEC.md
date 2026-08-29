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
| Deployment | Vercel | git push auto-deploys |

**Non-negotiable rules (constitution-level, agents must not violate):**
- Creating a listing, initiating chat, and viewing the map **all require login** (unlike the other candidate projects, this one must NOT be usable anonymously)
- Location calculations **must not use PostGIS or complex geo-queries** — for the MVP, use a simple lat/lng distance formula (Haversine) computed at the application layer; do not introduce an additional geo-database package
- Any screen involving a real-world meetup **must display a safety notice** (recommend meeting in a public place, confirm the other party beforehand) — this is a required UI element, not optional
- No payment/monetary transaction feature (this is pure sharing, not a marketplace)

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
- **When** the user fills in the food/ingredient they want to share (name, quantity description, optional photo, current location) and submits
- **Then** the system saves this listing to the database, marks it as "available", and ties it to that user's location

**FR-003｜Map showing nearby shareable items**
- **Given** the user is logged in and has granted browser location access
- **When** the user opens the map page
- **Then** Google Maps shows markers, centered on the user's current location, for all "available" listings nearby — clicking a marker shows the item's details

**FR-004｜1-on-1 chat request**
- **Given** the user sees a listing of interest on the map or in a list
- **When** the user clicks "Contact the sharer"
- **Then** the system creates (or opens an existing) 1-on-1 chat room between that user and the sharer, and both can exchange messages in real time (via Supabase Realtime)

**FR-005｜Mark meetup as complete**
- **Given** both parties have coordinated in chat
- **When** the sharer (listing owner) marks the listing as "exchange complete"
- **Then** the listing is removed from the "available" list on the map, its status updates to complete, and both parties see a status update notice in the chat

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

- [ ] FR-001~005 all passing = demo-ready (minimum showable bar)
- [ ] Non-logged-in users must not be able to access listing creation, chat, or contact info (must redirect clearly to the login page — not a blank screen or error)
- [ ] Map markers must correspond to real latitude/longitude data — no hardcoded fake data on the map
- [ ] Chat messages must update in real time (the recipient sees a new message without refreshing the page) — must be verified with an actual test of the Supabase Realtime subscription
- [ ] Listing status changes (available → complete) must be correctly reflected on the map and for both users

## 7. Open Questions (must be resolved before implementation)

- [NEEDS CLARIFICATION: Has a Google Maps API key been requested? Must be registered before work starts, and note that Google Maps requires a billing account to get a key even though the free tier should be sufficient for demo usage]
- [NEEDS CLARIFICATION: Is the user's location fetched live each time (asked every time the map opens), or set as a fixed location in the profile? Recommend "fetch current location every time the map opens" for the MVP — simpler]
- [NEEDS CLARIFICATION: Does the chat room need a notification mechanism (alert on new message)? For P1, recommend skipping push notifications — the user checks the chat room manually]
- [NEEDS CLARIFICATION: What distance threshold defines "nearby"? Also, test accounts and mock data need to be prepared in advance with realistic spread to verify the map display works well for the demo]

## 8. Definition of Done (termination condition for agents)

A task is considered "done" only when:
1. Its Given-When-Then acceptance criteria have actually been tested and passed (not just claimed by the agent)
2. It has not exceeded that agent's Scope Boundary
3. The reviewer agent or William personally has confirmed one manual happy-path run (using at least two test accounts to simulate "sharer creates a listing" and "requester finds it on the map and chats")
