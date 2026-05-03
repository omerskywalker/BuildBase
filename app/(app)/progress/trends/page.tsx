import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import TrendsView from "./TrendsView";

export default async function TrendsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/progress"
            className="flex items-center gap-2 text-content-secondary hover:text-content-primary mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Progress
          </Link>
          <h1 className="text-2xl font-bold text-content-primary font-display mb-1">
            Effort & Soreness Trends
          </h1>
          <p className="text-sm text-content-secondary">
            Track your effort levels and soreness patterns over time
          </p>
        </div>
      </div>

      <Suspense fallback={<div className="text-content-secondary">Loading trends...</div>}>
        <TrendsView userId={user.id} />
      </Suspense>
    </div>
  );
}