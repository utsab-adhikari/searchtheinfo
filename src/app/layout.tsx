"use client"
import "./globals.css";
import React from "react";
import Script from "next/script";
import { SessionProvider } from "next-auth/react";
import { MonitoringProvider } from "@/lib/monitoring/client";
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Google Analytics */}
        <Script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS}`}
          strategy="afterInteractive"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}        
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS}');
            `,
          }}
        />
      </head>
      <body className="bg-zinc-950 text-zinc-100">
        <SessionProvider>
          <MonitoringProvider />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}

type WebVitalsMetric = {
  name: string;
  value: number;
  id: string;
  label: string;
};

export function reportWebVitals(metric: WebVitalsMetric) {
  try {
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      id: metric.id,
      label: metric.label,
      path: typeof window !== "undefined" ? window.location.pathname : undefined,
    });

    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon("/api/metrics/web-vitals", body);
      return;
    }

    fetch("/api/metrics/web-vitals", {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body,
    }).catch(() => {});
  } catch {
    // ignore
  }
}
