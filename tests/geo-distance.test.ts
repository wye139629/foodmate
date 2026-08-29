import { describe, expect, it } from "vitest";
import { haversineDistanceKm } from "@/lib/geo-distance";

describe("haversineDistanceKm", () => {
  it("returns 0 for the same point", () => {
    expect(haversineDistanceKm(-33.8688, 151.2093, -33.8688, 151.2093)).toBe(
      0,
    );
  });

  it("matches the known London-Paris distance (~344km)", () => {
    const distance = haversineDistanceKm(51.5074, -0.1278, 48.8566, 2.3522);
    expect(distance).toBeGreaterThan(340);
    expect(distance).toBeLessThan(348);
  });

  it("matches the known New York-Los Angeles distance (~3936km)", () => {
    const distance = haversineDistanceKm(
      40.7128,
      -74.006,
      34.0522,
      -118.2437,
    );
    expect(distance).toBeGreaterThan(3900);
    expect(distance).toBeLessThan(3970);
  });

  it("matches the known Sydney-Melbourne distance (~714km)", () => {
    const distance = haversineDistanceKm(
      -33.8688,
      151.2093,
      -37.8136,
      144.9631,
    );
    expect(distance).toBeGreaterThan(700);
    expect(distance).toBeLessThan(730);
  });
});
