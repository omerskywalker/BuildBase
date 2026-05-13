export const EFFORT_LABELS: Record<number, { emoji: string; label: string; color: string }> = {
  1: { emoji: "🔴", label: "Easy",   color: "#D32F2F" },
  2: { emoji: "🟠", label: "Light",  color: "#F57C00" },
  3: { emoji: "🟡", label: "Solid",  color: "#FBC02D" },
  4: { emoji: "🟢", label: "Hard",   color: "#388E3C" },
  5: { emoji: "💪", label: "Maxed",  color: "#1B5E20" },
};

export const SORENESS_LABELS: Record<number, { emoji: string; label: string; color: string }> = {
  1: { emoji: "🔴", label: "Rough",  color: "#D32F2F" },
  2: { emoji: "🟠", label: "Sore",   color: "#F57C00" },
  3: { emoji: "🟡", label: "Tight",  color: "#FBC02D" },
  4: { emoji: "🟢", label: "Good",   color: "#388E3C" },
  5: { emoji: "🔋", label: "Fresh",  color: "#1B5E20" },
};

export const SORENESS_PROMPT_GAP_HOURS = 12;
export const SESSIONS_PER_PAGE = 3;
