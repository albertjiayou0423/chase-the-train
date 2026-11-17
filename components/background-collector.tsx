"use client";

import { useEffect } from "react";
import { runCollectorOnce } from "@/lib/collector/client";

export function BackgroundCollector() {
  useEffect(() => {
    let inFlight = false;
    async function tick() {
      if (inFlight) return;
      inFlight = true;
      try { await runCollectorOnce(); } catch { /* Retry on the next interval. */ }
      finally { inFlight = false; }
    }
    const first = window.setTimeout(() => void tick(), 2500);
    const interval = window.setInterval(() => void tick(), 60_000);
    window.addEventListener("online", tick);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(interval);
      window.removeEventListener("online", tick);
    };
  }, []);
  return null;
}
