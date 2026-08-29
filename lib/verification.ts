import type { createAdminSupabaseClient } from "@/lib/supabase-admin";

export async function listPendingVerifications(
  admin: ReturnType<typeof createAdminSupabaseClient>,
) {
  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id, display_name, verification_photo_path")
    .eq("verification_status", "pending");

  if (error) throw error;

  return Promise.all(
    (profiles ?? []).map(async (profile) => ({
      id: profile.id,
      displayName: profile.display_name,
      photoUrl: profile.verification_photo_path
        ? (
            await admin.storage
              .from("student-ids")
              .createSignedUrl(profile.verification_photo_path, 300)
          ).data?.signedUrl ?? null
        : null,
    })),
  );
}
