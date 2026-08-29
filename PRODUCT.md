# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

General neighbors sharing surplus food/ingredients locally — leftover cooking, bulk buys, moving out, a fridge clean-out. Casual, low-commitment: no account tier, no niche community assumed. Both the sharer (has surplus) and the requester (wants it) are the same user population, just on different sides of a given listing.

## Product Purpose

FoodMate lets someone with extra food or ingredients list it, lets a nearby neighbor discover it on a map, and gets the two of them coordinating a handoff via chat — reducing food waste and building small-scale local sharing. Success is a completed exchange: a listing goes from "available" to "complete" because two real people met up.

## Positioning

Trust & Safety is the headline, not a compliance afterthought: every new user goes through a safety-first onboarding (public-meetup guidance, community rules) before they can list, browse, or chat, and every listing photo is checked by AI for visible spoilage before it can go live. The map + chat loop underneath is the same shape every local-sharing app has — the differentiator is that this one is built to be safe to actually use with strangers, not just fast to list on.

(Revised 2026-08-29: the AI fridge-scan batch-listing feature — previously the stated differentiator — was removed entirely at William's request in favor of this Trust & Safety direction. Positioning below reflects the current, not the historical, product.)

## Operating Context

- Core flow: log in → complete safety-first onboarding (first time only) → create a listing by hand (photo optional; if attached, AI checks it for visible spoilage before the listing is created) → browse the map for nearby "available" listings → contact the sharer → coordinate a meetup in chat → sharer marks it complete.
- Location is fetched live from the browser every time the map opens (no stored/fixed profile location).
- Meetups are real-world and in-person — every screen that touches a meetup must carry a safety notice (public place, confirm the other party beforehand). This is a non-negotiable constraint, not a P2 nice-to-have.
- No payment or monetary transaction anywhere in the product — this is pure sharing, not a marketplace.

## Capabilities and Constraints

- Stack (locked, do not swap out): Next.js (App Router, TypeScript), Supabase (Postgres + Auth + Realtime), Google Maps JavaScript API, Anthropic Claude API (`claude-opus-5`, vision + structured outputs) for the food quality check, deployed on Vercel with auto-deploy on push to `main`.
- Onboarding completion is tracked via Supabase Auth `user_metadata`, not a separate table — a logged-in but non-onboarded user is redirected to `/onboarding` before reaching any identity-required page.
- Distance/geo math is plain Haversine at the application layer — no PostGIS, no geo-database extension.
- Chat is 1-on-1 only, real-time via Supabase Realtime Postgres changes. No push notifications/unread badges for now — the user checks the chat manually while it's open.
- Everything that touches identity (creating a listing, chatting, viewing the map) requires login; nothing in the product is usable anonymously.
- "Nearby" radius is user-selectable on the map (5/10/25/50 km presets, default 10 km), not a single fixed threshold.

## Evidence on Hand

No real user testimonials, case studies, press, or production usage data exist yet — this is a hackathon-stage MVP. Do not fabricate any of these. Real (if synthetic/test) data exists in the connected Supabase project from manual QA: actual listings, chat threads, and map markers with real lat/lng.

## Product Principles

- Trust & Safety ships before convenience features, not after — onboarding and the food quality check are P1, not P2 polish.
- Real-world safety around in-person meetups is never optional UI — it ships on every meetup-adjacent screen, not as an afterthought.
- Keep the trust/location/chat loop simple and honest: live location every time, no fake data on the map, no anonymous access, no payment surface to build unwarranted trust around.
- MVP scope discipline: P1 is login → onboarding → listing (+ quality check) → map → chat → complete. Everything else (filters, ratings, notifications, saved listings) is explicitly deferred, not silently scope-crept in.

## Accessibility & Inclusion

No accessibility standard or specific user need has been established yet for this project.
