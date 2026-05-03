import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Trophy, TrendingUp } from "lucide-react";
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
        <div className="flex gap-2">
          <Link
            href="/progress/charts"
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-dim transition-colors"
          >
            <TrendingUp size={16} />
            View Charts
          </Link>
          <Link href="/progress/milestones">
            <Button variant="outline" size="sm" className="gap-2">
              <Trophy className="h-4 w-4" />
              Milestones
            </Button>
          </Link>
          <Link
            href="/progress/trends"
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-dim transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
            View Trends
          </Link>
        </div>
      </div>

      <Suspense fallback={<div className="text-content-secondary">Loading progress...</div>}>
        <PhaseOverview userId={user.id} />
      </Suspense>
    </div>
  );
}
