import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase-auth";

const MAX_PHOTO_BYTES = 8 * 1024 * 1024; // 8MB

const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;
type SupportedImageType = (typeof SUPPORTED_IMAGE_TYPES)[number];

const ScanResultSchema = z.object({
  items: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
    }),
  ),
});

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const formData = await request.formData();
  const photo = formData.get("photo");

  if (!(photo instanceof File)) {
    return NextResponse.json(
      { error: "A photo file is required" },
      { status: 400 },
    );
  }

  if (
    !SUPPORTED_IMAGE_TYPES.includes(photo.type as SupportedImageType)
  ) {
    return NextResponse.json(
      {
        error:
          "Unsupported photo format — please use a JPEG, PNG, GIF, or WEBP file",
      },
      { status: 400 },
    );
  }

  if (photo.size > MAX_PHOTO_BYTES) {
    return NextResponse.json({ error: "Photo is too large" }, { status: 400 });
  }

  const bytes = Buffer.from(await photo.arrayBuffer()).toString("base64");
  const client = new Anthropic();

  let response;
  try {
    response = await client.messages.parse({
      model: "claude-opus-5",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: photo.type as SupportedImageType,
                data: bytes,
              },
            },
            {
              type: "text",
              text: "This is a photo of the inside of a fridge/pantry. List each distinct food or ingredient item that's visibly shareable, with a short quantity/freshness description for each (e.g. \"3 eggs left\", \"half a carton of milk\"). Skip items you can't identify.",
            },
          ],
        },
      ],
      output_config: {
        format: zodOutputFormat(ScanResultSchema),
      },
    });
  } catch (err) {
    console.error("Fridge scan: Anthropic request failed", err);
    return NextResponse.json(
      {
        error:
          "Could not process that photo — try a different one (a regular camera photo works best; some screenshots aren't supported)",
      },
      { status: 502 },
    );
  }

  if (!response.parsed_output) {
    return NextResponse.json(
      { error: "Could not parse items from the photo" },
      { status: 502 },
    );
  }

  return NextResponse.json({ items: response.parsed_output.items });
}
