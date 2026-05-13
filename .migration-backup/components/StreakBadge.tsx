import { cn } from "@/lib/utils";

interface StreakBadgeProps {
  streak: number;
  className?: string;
}

export default function StreakBadge({ streak, className }: StreakBadgeProps) {
  if (streak === 0) {
    return (
      <div className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
        "bg-bg-surface text-content-muted border border-border-subtle",
        className
      )}>
        <span className="text-content-muted">🔥</span>
        <span>No streak</span>
      </div>
    );
  }

  // Different styling based on streak length
  const getStreakStyle = (streakCount: number) => {
    if (streakCount >= 21) {
      return {
        bg: "bg-gradient-to-r from-orange-500 to-red-500",
        text: "text-white",
        glow: "shadow-lg shadow-orange-500/20",
        emoji: "⚡"
      };
    } else if (streakCount >= 14) {
      return {
        bg: "bg-gradient-to-r from-yellow-500 to-orange-500", 
        text: "text-white",
        glow: "shadow-md shadow-yellow-500/20",
        emoji: "🚀"
      };
    } else if (streakCount >= 7) {
      return {
        bg: "bg-accent",
        text: "text-white",
        glow: "shadow-md shadow-accent/20",
        emoji: "🔥"
      };
    } else {
      return {
        bg: "bg-success",
        text: "text-white", 
        glow: "shadow-sm shadow-success/20",
        emoji: "🔥"
      };
    }
  };

  const style = getStreakStyle(streak);

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-all",
      style.bg,
      style.text,
      style.glow,
      className
    )}>
      <span className="text-sm">{style.emoji}</span>
      <span>{streak} session{streak !== 1 ? 's' : ''}</span>
    </div>
  );
}