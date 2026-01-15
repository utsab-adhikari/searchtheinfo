"use client"
import { SessionProvider } from "next-auth/react";
import "./globals.css";
import React from "react";
import Script from "next/script";
import { useNavigationMetrics } from "@/hooks/useNavigationMetrics";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useNavigationMetrics();

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
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
