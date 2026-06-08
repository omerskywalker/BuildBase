"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Timer, X, RotateCcw } from "lucide-react";

const DEFAULT_REST_SECONDS = 90;
const REST_OPTIONS = [60, 90, 120, 180];

interface RestTimerProps {
  onClose: () => void;
}

export default function RestTimer({ onClose }: RestTimerProps) {
  const [duration, setDuration] = useState(DEFAULT_REST_SECONDS);
  const [remaining, setRemaining] = useState(DEFAULT_REST_SECONDS);
  const [isRunning, setIsRunning] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clear = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isRunning && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) {
            clear();
            setIsRunning(false);
            if (typeof navigator !== "undefined" && "vibrate" in navigator) {
              navigator.vibrate([200, 100, 200]);
            }
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    }
    return clear;
  }, [isRunning, remaining, clear]);

  const reset = () => {
    clear();
    setRemaining(duration);
    setIsRunning(true);
  };

  const changeDuration = (secs: number) => {
    clear();
    setDuration(secs);
    setRemaining(secs);
    setIsRunning(true);
  };

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const progress = duration > 0 ? ((duration - remaining) / duration) * 100 : 100;
  const isDone = remaining === 0;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-bg-elevated border border-border-subtle rounded-xl shadow-lg p-4 w-64 animate-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-content-primary">
          <Timer size={16} className={isDone ? "text-success" : "text-accent"} />
          <span className="text-sm font-semibold">
            {isDone ? "Rest Complete" : "Rest Timer"}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded text-content-muted hover:text-content-primary hover:bg-bg-hover transition-colors"
          aria-label="Close timer"
        >
          <X size={14} />
        </button>
      </div>

      {/* Countdown */}
      <div className="text-center mb-3">
        <span className={`text-3xl font-bold font-mono tabular-nums ${isDone ? "text-success" : "text-content-primary"}`}>
          {minutes}:{seconds.toString().padStart(2, "0")}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-bg-surface mb-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-linear ${isDone ? "bg-success" : "bg-accent"}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Duration presets */}
      <div className="flex gap-1.5 mb-3">
        {REST_OPTIONS.map((secs) => (
          <button
            key={secs}
            type="button"
            onClick={() => changeDuration(secs)}
            className={`flex-1 text-xs py-1 rounded-md border transition-colors ${
              duration === secs
                ? "border-accent text-accent bg-accent/10"
                : "border-border-subtle text-content-secondary hover:border-border-strong"
            }`}
          >
            {secs >= 60 ? `${secs / 60}m` : `${secs}s`}
          </button>
        ))}
      </div>

      {/* Reset */}
      <button
        type="button"
        onClick={reset}
        className="w-full flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-md border border-border-subtle text-content-secondary hover:text-content-primary hover:border-border-strong transition-colors"
      >
        <RotateCcw size={12} />
        Reset
      </button>
    </div>
  );
}
