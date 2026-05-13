import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ChartContainer from "./ChartContainer";

export default async function ChartsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/progress"
          className="inline-flex items-center gap-2 px-3 py-2 text-content-secondary hover:text-content-primary hover:bg-bg-hover rounded-lg transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Progress
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-content-primary font-display mb-1">
            Lift Charts
          </h1>
          <p className="text-sm text-content-secondary">
            Track your weight progression over time per exercise
          </p>
        </div>
      </div>

      <Suspense fallback={<div className="text-content-secondary">Loading charts...</div>}>
        <ChartContainer userId={user.id} />
      </Suspense>
    </div>
  );
}