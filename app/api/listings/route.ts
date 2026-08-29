import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase-auth";
import { isListingCategory } from "@/lib/listing-categories";

const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;
type SupportedImageType = (typeof SUPPORTED_IMAGE_TYPES)[number];

// Single Claude call does both jobs: the FR-012 safety gate and the FR-013
// recommend score. Computed server-side (fetching the just-uploaded photo by
// its public URL) rather than trusting client input, since the score is
// shown publicly and a client-supplied score could be faked.
const PhotoAnalysisSchema = z.object({
  safe: z.boolean(),
  safetyReason: z.string().nullable(),
  recommendScore: z.number().int().min(0).max(10),
  scoreReason: z.string(),
});

interface CreateListingBody {
  name?: string;
  description?: string;
  photoUrl?: string;
  category?: string;
  lat?: number;
  lng?: number;
}

async function analyzePhoto(photoUrl: string, name: string, description: string) {
  const imageResponse = await fetch(photoUrl);
  if (!imageResponse.ok) {
    throw new Error("Could not read the uploaded photo");
  }

  const contentType = imageResponse.headers.get("content-type") ?? "";
  if (!SUPPORTED_IMAGE_TYPES.includes(contentType as SupportedImageType)) {
    throw new Error(
      "Unsupported photo format — please use a JPEG, PNG, GIF, or WEBP file",
    );
  }

  const bytes = Buffer.from(await imageResponse.arrayBuffer()).toString(
    "base64",
  );
  const client = new Anthropic();

  const response = await client.messages.parse({
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
              media_type: contentType as SupportedImageType,
              data: bytes,
            },
          },
          {
            type: "text",
            text: `This photo is attached to a listing on a neighbor-to-neighbor food sharing app. Listing name: "${name}". Description: "${description || "(none given)"}".

First, decide if it's SAFE to share: flag unsafe if you see visible mold, rot, significant spoilage, or the photo doesn't show food/ingredients at all. Minor cosmetic imperfections (bruising, odd shapes) are fine.

If safe, also give a 0-10 recommend score reflecting how fresh the food looks in the photo AND how much effort the sharer put into describing it (a specific, thoughtful description scores higher than a vague or empty one). Give a short one-sentence reason for the score. If unsafe, set recommendScore to 0 and scoreReason to a short note — it won't be published anyway.`,
          },
        ],
      },
    ],
    output_config: {
      format: zodOutputFormat(PhotoAnalysisSchema),
    },
  });

  if (!response.parsed_output) {
    throw new Error("Could not assess that photo");
  }
  return response.parsed_output;
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as CreateListingBody;
  const { name, description, photoUrl, category, lat, lng } = body;

  if (!name || typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json(
      { error: "name, lat, and lng are required" },
      { status: 400 },
    );
  }

  if (category !== undefined && !isListingCategory(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  let recommendScore: number | null = null;
  let recommendReason: string | null = null;

  if (photoUrl) {
    let analysis;
    try {
      analysis = await analyzePhoto(photoUrl, name, description ?? "");
    } catch (err) {
      console.error("Listing photo analysis failed", err);
      return NextResponse.json(
        {
          error:
            err instanceof Error
              ? err.message
              : "Could not check that photo — try a different one",
        },
        { status: 502 },
      );
    }

    if (!analysis.safe) {
      return NextResponse.json(
        {
          error:
            analysis.safetyReason ??
            "That photo doesn't look safe to share — try another",
        },
        { status: 400 },
      );
    }

    recommendScore = analysis.recommendScore;
    recommendReason = analysis.scoreReason;
  }

  const { data, error } = await supabase
    .from("listings")
    .insert({
      owner_id: user.id,
      name,
      description: description ?? null,
      photo_url: photoUrl ?? null,
      category: category ?? null,
      lat,
      lng,
      status: "available",
      recommend_score: recommendScore,
      recommend_reason: recommendReason,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ listing: data }, { status: 201 });
}
