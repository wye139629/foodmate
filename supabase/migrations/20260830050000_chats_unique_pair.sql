-- Prevent duplicate chats between the same two users regardless of which
-- column each ended up in. Found via a real race: /app/chat/new's effect
-- double-fires (React StrictMode in dev, or a slow network + user_id_1)
-- retry), and two concurrent "does a chat exist yet" checks both said no.
create unique index if not exists chats_unique_pair
  on public.chats (least(user_id_1, user_id_2), greatest(user_id_1, user_id_2));
