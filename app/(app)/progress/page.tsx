import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { TrendingUp } from "lucide-react";
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
        <Link
          href="/progress/charts"
          className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-dim transition-colors"
        >
          <TrendingUp size={16} />
          View Charts
        </Link>
      </div>

      <Suspense fallback={<div className="text-content-secondary">Loading progress...</div>}>
        <PhaseOverview userId={user.id} />
      </Suspense>
    </div>
  );
}
