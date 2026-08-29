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

describe("/feedback route guard", () => {
  beforeEach(() => {
    getUser.mockReset();
  });

  it("redirects an unauthenticated user to /login", async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    const response = await middleware(makeRequest("/feedback?chatId=abc"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login");
  });

  it("redirects a logged-in but non-onboarded user to /onboarding", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1", user_metadata: {} } },
    });

    const response = await middleware(makeRequest("/feedback?chatId=abc"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/onboarding");
  });

  it("lets an onboarded user through", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1", user_metadata: { onboarded: true } } },
    });

    const response = await middleware(makeRequest("/feedback?chatId=abc"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });
});
