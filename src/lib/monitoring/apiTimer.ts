import { NextRequest, NextResponse } from "next/server";
import { isColdStart } from "./coldStart";
import { logMetric } from "./logger";
import type { MetricStatus } from "./types";

export type RouteHandler<TContext = unknown> = (
  req: NextRequest,
  context: TContext
) => Promise<NextResponse>;

/**
 * Wrap a Next.js App Router route handler to record API latency metrics.
 * Uses process.hrtime.bigint() for high-resolution timing.
 */
export function withApiTiming<TContext = unknown>(
  name: string,
  handler: RouteHandler<TContext>
): RouteHandler<TContext> {
  return async (req: NextRequest, context: TContext): Promise<NextResponse> => {
    const start = process.hrtime.bigint();
    const cold = isColdStart();

    try {
      const res = await handler(req, context);
      const durationNs = process.hrtime.bigint() - start;
      const durationMs = Number(durationNs) / 1_000_000;

      const status: MetricStatus = String(res.status);

      void logMetric({
        type: "api",
        name,
        duration: durationMs,
        status,
        metadata: {
          path: req.nextUrl.pathname,
          method: req.method,
          coldStart: cold,
        },
      });

      return res;
    } catch (error) {
      const durationNs = process.hrtime.bigint() - start;
      const durationMs = Number(durationNs) / 1_000_000;

      void logMetric({
        type: "api",
        name,
        duration: durationMs,
        status: "error",
        metadata: {
          path: req.nextUrl.pathname,
          method: req.method,
          coldStart: cold,
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
        },
      });

      throw error;
    }
  };
}

/**
 * Simpler wrapper for handlers that only use (req) and no context.
 */
export function withApiTimingSimple(
  name: string,
  handler: (req: NextRequest) => Promise<NextResponse>
): (req: NextRequest) => Promise<NextResponse> {
  return async (req: NextRequest): Promise<NextResponse> => {
    const start = process.hrtime.bigint();
    const cold = isColdStart();

    try {
      const res = await handler(req);
      const durationNs = process.hrtime.bigint() - start;
      const durationMs = Number(durationNs) / 1_000_000;

      const status: MetricStatus = String(res.status);

      void logMetric({
        type: "api",
        name,
        duration: durationMs,
        status,
        metadata: {
          path: req.nextUrl.pathname,
          method: req.method,
          coldStart: cold,
        },
      });

      return res;
    } catch (error) {
      const durationNs = process.hrtime.bigint() - start;
      const durationMs = Number(durationNs) / 1_000_000;

      void logMetric({
        type: "api",
        name,
        duration: durationMs,
        status: "error",
        metadata: {
          path: req.nextUrl.pathname,
          method: req.method,
          coldStart: cold,
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
        },
      });

      throw error;
    }
  };
}

/**
 * Generic helper to time any async operation (not just HTTP handlers).
 */
export async function timeAsync<T>(
  name: string,
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>,
  status: MetricStatus = "success"
): Promise<T> {
  const start = process.hrtime.bigint();
  try {
    const result = await fn();
    const durationNs = process.hrtime.bigint() - start;
    const durationMs = Number(durationNs) / 1_000_000;

    void logMetric({ type: "api", name, duration: durationMs, status, metadata });
    return result;
  } catch (error) {
    const durationNs = process.hrtime.bigint() - start;
    const durationMs = Number(durationNs) / 1_000_000;

    void logMetric({
      type: "api",
      name,
      duration: durationMs,
      status: "error",
      metadata: {
        ...(metadata || {}),
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      },
    });
    throw error;
  }
}
