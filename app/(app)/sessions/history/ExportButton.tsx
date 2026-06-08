"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";

export function ExportButton() {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const res = await fetch("/api/sessions/export");
      if (!res.ok) {
        const msg = res.status === 404
          ? "No completed sessions to export"
          : "Failed to export data";
        toast.error(msg);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] ??
        "buildbase-workouts.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Workout data exported");
    } catch {
      toast.error("Export failed — please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-border-subtle text-content-secondary hover:text-content-primary hover:border-border-strong transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Download size={14} />
      {loading ? "Exporting..." : "Export CSV"}
    </button>
  );
}
