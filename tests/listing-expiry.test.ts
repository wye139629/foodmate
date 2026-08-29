import { describe, expect, it } from "vitest";
import {
  LISTING_ACTIVE_HOURS,
  isListingExpired,
  isOwnerTogglableStatus,
  listingActiveCutoffIso,
} from "@/lib/listing-status";

const NOW = Date.parse("2026-08-30T12:00:00.000Z");
const HOUR_MS = 60 * 60 * 1000;

describe("listing 48h active window (FR-009)", () => {
  it("keeps a listing under 48h old active", () => {
    const created = new Date(NOW - 47 * HOUR_MS).toISOString();
    expect(isListingExpired(created, NOW)).toBe(false);
  });

  it("expires a listing older than 48h", () => {
    const created = new Date(NOW - 49 * HOUR_MS).toISOString();
    expect(isListingExpired(created, NOW)).toBe(true);
  });

  it("expires a listing exactly at the 48h boundary", () => {
    const created = new Date(NOW - LISTING_ACTIVE_HOURS * HOUR_MS).toISOString();
    expect(isListingExpired(created, NOW)).toBe(true);
  });

  it("puts the query cutoff 48h before now", () => {
    expect(listingActiveCutoffIso(NOW)).toBe(
      new Date(NOW - 48 * HOUR_MS).toISOString(),
    );
  });
});

describe("isOwnerTogglableStatus", () => {
  it("accepts available and taken", () => {
    expect(isOwnerTogglableStatus("available")).toBe(true);
    expect(isOwnerTogglableStatus("taken")).toBe(true);
  });

  it("rejects anything else", () => {
    for (const value of ["complete", "", "TAKEN", null, undefined, 1]) {
      expect(isOwnerTogglableStatus(value)).toBe(false);
    }
  });
});
