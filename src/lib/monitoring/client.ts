"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

type WebVitalMetric = {
  name: string;
  value: number;
  id?: string;
  label?: string;
};

async function sendWebVitals(metrics: (WebVitalMetric & { path: string })[]) {
  try {
    await fetch("/api/metrics/web-vitals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(metrics),
      keepalive: true,
    });
  } catch {
    // ignore client-side metric failures
  }
}

type ActivityPayload = {
  userId?: string | null;
  role: "guest" | "editor" | "admin";
  action: "view" | "create" | "update" | "delete";
  route: string;
  ip: string;
  userAgent: string;
  metadata?: Record<string, unknown>;
};

async function sendActivity(payload: ActivityPayload) {
  try {
    await fetch("/api/metrics/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // ignore client-side activity failures
  }
}

/**
 * Attach to root layouts to capture basic navigation, page load, and activity metrics.
 */
export function MonitoringProvider() {
  const pathname = usePathname();
  const { data: session } = useSession();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const navEntry = performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined;

    if (navEntry) {
      const pageLoad = navEntry.domContentLoadedEventEnd - navEntry.startTime;
      void sendWebVitals([
        {
          name: "page-load",
          value: pageLoad,
          path: pathname || window.location.pathname,
        },
      ]);
    }
  }, [pathname, session]);

  useEffect(() => {
    if (typeof window === "undefined" || !pathname) return;

    const user = session?.user as
      | { id?: string; role?: ActivityPayload["role"] }
      | null;
    const role: ActivityPayload["role"] = user?.role ?? "guest";

    void sendActivity({
      role,
      action: "view",
      route: pathname,
      ip: "0.0.0.0",
      userAgent: navigator.userAgent,
      userId: user?.id ?? null,
    });
  }, [pathname, session]);

  return null;
}
