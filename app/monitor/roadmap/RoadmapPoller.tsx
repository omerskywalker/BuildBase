"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";

const POLL_INTERVAL = 30_000; // 30s

function fireConfetti() {
  // Two simultaneous bursts from left and right
  void confetti({
    particleCount: 80,
    spread: 70,
    origin: { x: 0.25, y: 0.6 },
    colors: ["#C84B1A", "#2D7A3A", "#3060A0", "#E8F0E8", "#C08030"],
    zIndex: 9999,
  });
  void confetti({
    particleCount: 80,
    spread: 70,
    origin: { x: 0.75, y: 0.6 },
    colors: ["#C84B1A", "#2D7A3A", "#3060A0", "#E8F0E8", "#C08030"],
    zIndex: 9999,
  });
}

export function RoadmapPoller({
  inProgressIds,
  doneIds,
}: {
  inProgressIds: string[];
  doneIds: string[];
}) {
  const router = useRouter();
  const prevDoneRef = useRef<string>(doneIds.join(","));
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (inProgressIds.length === 0) return;

    const interval = setInterval(() => {
      router.refresh();
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [inProgressIds.length, router]);

  // Fire confetti when new items transition to done
  useEffect(() => {
    const currentDone = doneIds.join(",");

    // Skip on first render — we don't want confetti just for loading the page
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevDoneRef.current = currentDone;
      return;
    }

    if (prevDoneRef.current !== currentDone) {
      // Count how many new items completed
      const prevSet = new Set(prevDoneRef.current ? prevDoneRef.current.split(",") : []);
      const newlyDone = doneIds.filter((id) => !prevSet.has(id));

      if (newlyDone.length > 0) {
        fireConfetti();
      }

      prevDoneRef.current = currentDone;
    }
  }, [doneIds]);

  return null;
}
