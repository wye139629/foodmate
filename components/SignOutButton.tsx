"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-auth";
import { Button } from "@/components/ui/button";

export default function SignOutButton({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button
      variant="outline"
      onClick={handleSignOut}
      disabled={loading}
      className={className ?? "h-9 rounded px-3 text-sm font-semibold"}
    >
      {loading ? "…" : (children ?? "Log out")}
    </Button>
  );
}
