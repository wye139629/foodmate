# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

General neighbors sharing surplus food/ingredients locally — leftover cooking, bulk buys, moving out, a fridge clean-out. Casual, low-commitment: no account tier, no niche community assumed. Both the sharer (has surplus) and the requester (wants it) are the same user population, just on different sides of a given listing.

## Product Purpose

FoodMate lets someone with extra food or ingredients list it, lets a nearby neighbor discover it on a map, and gets the two of them coordinating a handoff via chat — reducing food waste and building small-scale local sharing. Success is a completed exchange: a listing goes from "available" to "complete" because two real people met up.

## Positioning

The AI fridge scan is the mechanism a neighboring listing app couldn't casually copy: point a camera at your fridge/pantry, and Claude vision turns it into a reviewable checklist that becomes multiple listings in one step — instead of typing each item into a form by hand. This is the headline differentiator, not a convenience bolt-on; the map + chat loop underneath is the same shape every local-sharing app has.

## Operating Context

- Core flow: log in → create a listing (by hand, or via AI fridge scan → review checklist → batch-create) → browse the map for nearby "available" listings → contact the sharer → coordinate a meetup in chat → sharer marks it complete.
- Location is fetched live from the browser every time the map opens (no stored/fixed profile location).
- Meetups are real-world and in-person — every screen that touches a meetup must carry a safety notice (public place, confirm the other party beforehand). This is a non-negotiable constraint, not a P2 nice-to-have.
- No payment or monetary transaction anywhere in the product — this is pure sharing, not a marketplace.

## Capabilities and Constraints

- Stack (locked, do not swap out): Next.js (App Router, TypeScript), Supabase (Postgres + Auth + Realtime), Google Maps JavaScript API, Anthropic Claude API (`claude-opus-5`, vision + structured outputs) for the fridge scan, deployed on Vercel with auto-deploy on push to `main`.
- Distance/geo math is plain Haversine at the application layer — no PostGIS, no geo-database extension.
- Chat is 1-on-1 only, real-time via Supabase Realtime Postgres changes. No push notifications/unread badges for now — the user checks the chat manually while it's open.
- Everything that touches identity (creating a listing, chatting, viewing the map) requires login; nothing in the product is usable anonymously.
- "Nearby" radius is user-selectable on the map (5/10/25/50 km presets, default 10 km), not a single fixed threshold.

## Evidence on Hand

No real user testimonials, case studies, press, or production usage data exist yet — this is a hackathon-stage MVP. Do not fabricate any of these. Real (if synthetic/test) data exists in the connected Supabase project from manual QA: actual listings created via both the manual form and the AI fridge scan, actual chat threads, actual map markers with real lat/lng.

## Product Principles

- Removing manual data entry (the fridge scan) matters more than adding features — the product's edge is making listing effortless, not listing exhaustively.
- Real-world safety around in-person meetups is never optional UI — it ships on every meetup-adjacent screen, not as an afterthought.
- Keep the trust/location/chat loop simple and honest: live location every time, no fake data on the map, no anonymous access, no payment surface to build unwarranted trust around.
- MVP scope discipline: P1 is login → listing (+ AI scan) → map → chat → complete. Everything else (filters, ratings, notifications, saved listings) is explicitly deferred, not silently scope-crept in.

## Accessibility & Inclusion

No accessibility standard or specific user need has been established yet for this project.
