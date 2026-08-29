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

describe("auth middleware", () => {
  beforeEach(() => {
    getUser.mockReset();
  });

  it("redirects a non-logged-in user away from a protected route to /login", async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    const response = await middleware(makeRequest("/map"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login");
  });

  it("lets a logged-in user through to a protected route", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const response = await middleware(makeRequest("/listings/new"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("does not gate public routes like /login", async () => {
    const response = await middleware(makeRequest("/login"));

    expect(response.status).toBe(200);
    expect(getUser).not.toHaveBeenCalled();
  });
});
