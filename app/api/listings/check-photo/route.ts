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

const QualityCheckResultSchema = z.object({
  safe: z.boolean(),
  reason: z.string().nullable(),
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

  if (!SUPPORTED_IMAGE_TYPES.includes(photo.type as SupportedImageType)) {
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
      max_tokens: 1024,
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
              text: "This photo is attached to a listing on a neighbor-to-neighbor food sharing app. Assess whether the food/ingredients shown look safe and appropriate to share with a stranger. Flag it as unsafe if you see visible mold, rot, significant spoilage, or if the photo doesn't show food/ingredients at all. Minor cosmetic imperfections (bruising, odd shapes) are fine. Respond with whether it's safe, and if not, a short, specific reason a sharer could act on.",
            },
          ],
        },
      ],
      output_config: {
        format: zodOutputFormat(QualityCheckResultSchema),
      },
    });
  } catch (err) {
    console.error("Food quality check: Anthropic request failed", err);
    return NextResponse.json(
      {
        error:
          "Could not check that photo — try a different one (a regular camera photo works best; some screenshots aren't supported)",
      },
      { status: 502 },
    );
  }

  if (!response.parsed_output) {
    return NextResponse.json(
      { error: "Could not assess that photo" },
      { status: 502 },
    );
  }

  return NextResponse.json(response.parsed_output);
}
