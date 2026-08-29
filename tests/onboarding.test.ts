import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const getUser = vi.fn();

vi.mock("@/lib/supabase-auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/supabase-auth")>();
  return {
    ...actual,
    createMiddlewareSupabaseClient: () => ({ auth: { getUser } }),
  };
});

const { middleware } = await import("@/middleware");

function makeRequest(path: string) {
  return new NextRequest(new URL(path, "http://localhost:3000"));
}

describe("onboarding gate", () => {
  beforeEach(() => {
    getUser.mockReset();
  });

  it("redirects a logged-in, non-onboarded user away from a protected route to /onboarding", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1", user_metadata: {} } },
    });

    const response = await middleware(makeRequest("/map"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/onboarding");
    expect(response.headers.get("location")).toContain(
      "redirectedFrom=%2Fmap",
    );
  });

  it("lets an onboarded user through to a protected route", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1", user_metadata: { onboarded: true } } },
    });

    const response = await middleware(makeRequest("/map"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("does not redirect-loop a non-onboarded user visiting /onboarding itself", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1", user_metadata: {} } },
    });

    const response = await middleware(makeRequest("/onboarding"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("still redirects an unauthenticated user to /login, not /onboarding", async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    const response = await middleware(makeRequest("/map"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login");
  });
});
