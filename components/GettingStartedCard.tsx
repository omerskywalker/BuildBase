import { Card, CardContent } from "@/components/ui/card";
import { Dumbbell, TrendingUp, BarChart3, Sparkles } from "lucide-react";

export default function GettingStartedCard({ hasCoach }: { hasCoach: boolean }) {
  return (
    <Card className="bg-bg-elevated border-border-subtle">
      <CardContent className="py-10 px-6">
        <div className="flex flex-col items-center text-center max-w-lg mx-auto">
          <div className="h-14 w-14 rounded-full bg-accent/10 flex items-center justify-center mb-5">
            <Sparkles className="h-7 w-7 text-accent" />
          </div>
          <h2 className="text-xl font-bold text-content-primary mb-2 font-display">
            Getting Started
          </h2>
          <p className="text-sm text-content-secondary leading-relaxed mb-6">
            Welcome to{" "}
            <span style={{ color: "#1C3A2A" }}>Build</span>
            <span style={{ color: "#C84B1A", fontWeight: 700 }}>Base</span>
            !{" "}
            {hasCoach
              ? "Your coach will assign you a training program soon. Once enrolled, your sessions, progress tracking, and workout history will appear right here."
              : "A training program will be assigned to you shortly. Once enrolled, your sessions, progress tracking, and workout history will appear right here."}
          </p>
          <div className="w-full space-y-3">
            <div className="flex items-center gap-3 bg-bg-base rounded-lg p-3 border border-border-subtle">
              <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                <Dumbbell className="h-4 w-4 text-accent" />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-content-primary">Log Workouts</div>
                <div className="text-xs text-content-muted">Track sets, reps, and weights for every session</div>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-bg-base rounded-lg p-3 border border-border-subtle">
              <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-content-primary">Track Progress</div>
                <div className="text-xs text-content-muted">See your strength gains over time with charts</div>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-bg-base rounded-lg p-3 border border-border-subtle">
              <div className="h-8 w-8 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                <BarChart3 className="h-4 w-4 text-brand" />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-content-primary">
                  {hasCoach ? "Coach Guidance" : "Structured Programs"}
                </div>
                <div className="text-xs text-content-muted">
                  {hasCoach
                    ? "Get personalized notes and form feedback from your coach"
                    : "Follow a structured 12-week strength training plan"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
