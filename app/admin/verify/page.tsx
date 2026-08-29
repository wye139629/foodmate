import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-auth";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { isAdminEmail } from "@/lib/admin";
import { listPendingVerifications } from "@/lib/verification";
import AdminVerifyActions from "@/components/AdminVerifyActions";

export default async function AdminVerifyPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdminEmail(user?.email)) {
    redirect("/map");
  }

  const admin = createAdminSupabaseClient();
  const pending = await listPendingVerifications(admin);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col px-4 pt-12 pb-24">
      <h1 className="font-heading mb-6 text-xl font-bold">
        Student ID Reviews
      </h1>

      {pending.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-14 text-center">
          <p className="font-heading text-base font-bold">All caught up</p>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            No pending student ID reviews.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {pending.map((profile) => (
            <div
              key={profile.id}
              className="overflow-hidden rounded-lg border border-border bg-card"
            >
              <div className="aspect-[4/3] w-full bg-muted">
                {profile.photoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- signed Supabase Storage URL, not a static import
                  <img
                    src={profile.photoUrl}
                    alt=""
                    className="size-full object-cover"
                  />
                )}
              </div>
              <div className="p-4">
                <p className="mb-3 font-heading text-sm font-bold">
                  {profile.displayName}
                </p>
                <AdminVerifyActions userId={profile.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
