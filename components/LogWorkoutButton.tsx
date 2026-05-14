"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import QuickLogModal from "@/components/QuickLogModal";

export default function LogWorkoutButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-sm transition-transform hover:scale-105 active:scale-95 shrink-0"
        style={{ background: "#C84B1A" }}
      >
        <Plus className="h-4 w-4" />
        Log Workout
      </button>
      <QuickLogModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
