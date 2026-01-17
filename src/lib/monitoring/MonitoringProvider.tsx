"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

const WEB_VITALS_ENDPOINT = "/api/metrics/web-vitals";
const ACTIVITY_ENDPOINT = "/api/metrics/activity";

interface WebVitalEvent {
  name: string;
  value: number;
  path?: string;
}

interface ActivityPayload {
  userId?: string | null;
  role: "guest" | "editor" | "admin";
  action: "view" | "create" | "update" | "delete";
  route: string;
  ip: string;
  userAgent: string;
  metadata?: Record<string, unknown>;
}

export function MonitoringProvider() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const lastNavTimeRef = useRef<number | null>(null);
  const lastPathRef = useRef<string | null>(null);

  // Initial page-load timing
  useEffect(() => {
    try {
      const entries = performance.getEntriesByType(
        "navigation"
      ) as PerformanceNavigationTiming[];
      const nav = entries[0];
      const value = nav
        ? nav.loadEventEnd - nav.startTime
        : performance.now();

      void sendWebVital({
        name: "page-load",
        value,
        path: window.location.pathname,
      });
    } catch {
      // ignore
    }
  }, []);

  // Route change timing + page view logging
  useEffect(() => {
    if (!pathname) return;

    const now = performance.now();
    const lastPath = lastPathRef.current;
    const lastTime = lastNavTimeRef.current;

    if (lastPath && lastTime != null && lastPath !== pathname) {
      const duration = now - lastTime;
      void sendWebVital({
        name: "route-change",
        value: duration,
        path: pathname,
      });
    }

    lastPathRef.current = pathname;
    lastNavTimeRef.current = now;

    const user = session?.user as {
      id?: string;
      role?: ActivityPayload["role"];
    } | null;

    void sendActivity({
      userId: user?.id ?? null,
      role: (user?.role as ActivityPayload["role"]) || "guest",
      action: "view",
      route: pathname,
      ip: "0.0.0.0",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    });
  }, [pathname, session]);

  return null;
}

async function sendWebVital(event: WebVitalEvent) {
  try {
    const body = JSON.stringify(event);
    if (navigator.sendBeacon) {
      navigator.sendBeacon(WEB_VITALS_ENDPOINT, body);
      return;
    }

    await fetch(WEB_VITALS_ENDPOINT, {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body,
    });
  } catch {
    // ignore
  }
}

async function sendActivity(payload: ActivityPayload) {
  try {
    await fetch(ACTIVITY_ENDPOINT, {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // ignore
  }
}
