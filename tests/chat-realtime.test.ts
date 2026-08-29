// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

type PostgresChangesCallback = (payload: {
  new: { id: string; sender_id: string; content: string; created_at: string };
}) => void;

const removeChannel = vi.fn();
let capturedCallback: PostgresChangesCallback | null = null;
let capturedConfig: Record<string, unknown> | null = null;
let capturedChannelName: string | null = null;

const on = vi.fn(
  (
    _event: string,
    config: Record<string, unknown>,
    callback: PostgresChangesCallback,
  ) => {
    capturedConfig = config;
    capturedCallback = callback;
    return { subscribe: () => ({}) };
  },
);
const channel = vi.fn((name: string) => {
  capturedChannelName = name;
  return { on };
});

vi.mock("@/lib/supabase-auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/supabase-auth")>();
  return {
    ...actual,
    createClient: () => ({ channel, removeChannel }),
  };
});

const { default: ChatWindow } = await import("@/components/ChatWindow");

describe("ChatWindow realtime subscription", () => {
  it("subscribes to postgres_changes filtered to this chat", async () => {
    const { default: React } = await import("react");
    render(
      React.createElement(ChatWindow, {
        chatId: "chat-1",
        currentUserId: "user-1",
      }),
    );

    expect(capturedChannelName).toBe("chat-chat-1");
    expect(capturedConfig).toMatchObject({
      event: "INSERT",
      schema: "public",
      table: "messages",
      filter: "chat_id=eq.chat-1",
    });
  });

  it("appends a message when the subscription fires", async () => {
    const { default: React } = await import("react");
    render(
      React.createElement(ChatWindow, {
        chatId: "chat-1",
        currentUserId: "user-1",
      }),
    );

    expect(capturedCallback).not.toBeNull();
    capturedCallback!({
      new: {
        id: "m1",
        sender_id: "user-2",
        content: "Hello there",
        created_at: new Date().toISOString(),
      },
    });

    expect(await screen.findByText(/Hello there/)).toBeTruthy();
    expect(screen.getByText(/Them:/)).toBeTruthy();
  });
});
