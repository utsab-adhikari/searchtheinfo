"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { sendClientMetric } from "@/lib/metrics/client";

// Tracks client-side navigation durations using Performance API
export function useNavigationMetrics() {
  const pathname = usePathname();
  const lastPathRef = useRef<string | null>(null);
  const startRef = useRef<number | null>(null);

  // Start timing on path change detection
  useEffect(() => {
    if (lastPathRef.current === pathname) return;
    lastPathRef.current = pathname;
    startRef.current = performance.now();

    // Next paint approximation for navigation completion
    requestAnimationFrame(() => {
      if (startRef.current != null) {
        const duration = performance.now() - startRef.current;
        sendClientMetric({
          type: "navigation",
          name: "route-change",
          duration,
          path: pathname || "/",
        });
      }
    });
  }, [pathname]);
}
