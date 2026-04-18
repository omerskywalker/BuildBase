import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PhaseOverview from "./PhaseOverview";

export default async function ProgressPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-content-primary font-display mb-1">
            Progress
          </h1>
          <p className="text-sm text-content-secondary">
            Track your journey through your 12-week strength program
          </p>
        </div>
      </div>

      <Suspense fallback={<div className="text-content-secondary">Loading progress...</div>}>
        <PhaseOverview userId={user.id} />
      </Suspense>
    </div>
  );
}
