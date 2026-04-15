"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const POLL_INTERVAL = 30_000; // 30s

export function RoadmapPoller({
  inProgressIds,
  doneIds,
}: {
  inProgressIds: string[];
  doneIds: string[];
}) {
  const router = useRouter();
  const prevDoneRef = useRef(doneIds.join(","));

  useEffect(() => {
    if (inProgressIds.length === 0) return;

    const interval = setInterval(() => {
      router.refresh();
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [inProgressIds.length, router]);

  // Trigger a visual cue when something transitions to done
  useEffect(() => {
    const currentDone = doneIds.join(",");
    if (prevDoneRef.current !== currentDone) {
      prevDoneRef.current = currentDone;
    }
  }, [doneIds]);

  return null;
}
