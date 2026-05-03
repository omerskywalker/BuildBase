import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MilestonesOverview from "./MilestonesOverview";

export default async function MilestonesPage() {
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
            Milestones & Achievements
          </h1>
          <p className="text-sm text-content-secondary">
            Track your streaks, personal records, and program milestones
          </p>
        </div>
      </div>

      <Suspense fallback={<div className="text-content-secondary">Loading achievements...</div>}>
        <MilestonesOverview userId={user.id} />
      </Suspense>
    </div>
  );
}