import { cn } from "@/lib/utils";

interface StreakBadgeProps {
  streak: number;
  className?: string;
}

export default function StreakBadge({ streak, className }: StreakBadgeProps) {
  if (streak === 0) {
    return (
      <div className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-bg-surface text-content-muted border border-border-subtle", className)}>
        <span>🔥</span><span>No streak</span>
      </div>
    );
  }

  const getStreakStyle = (count: number) => {
    if (count >= 21) return { bg: "bg-gradient-to-r from-orange-500 to-red-500", text: "text-white", emoji: "⚡" };
    if (count >= 14) return { bg: "bg-gradient-to-r from-yellow-500 to-orange-500", text: "text-white", emoji: "🚀" };
    if (count >= 7) return { bg: "bg-accent", text: "text-white", emoji: "🔥" };
    return { bg: "bg-success", text: "text-white", emoji: "🔥" };
  };

  const style = getStreakStyle(streak);

  return (
    <div className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium", style.bg, style.text, className)}>
      <span className="text-sm">{style.emoji}</span>
      <span>{streak} session{streak !== 1 ? "s" : ""}</span>
    </div>
  );
}
