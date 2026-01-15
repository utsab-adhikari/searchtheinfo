import { NextRequest, NextResponse } from "next/server";
import { performance } from "perf_hooks";
import connectDB from "@/database/connectDB";
import Metric, { MetricType } from "@/models/metricModel";

export type MetricPayload = {
  type: MetricType;
  name: string;
  duration?: number;
  path?: string;
  method?: string;
  metadata?: Record<string, any>;
};

export async function recordMetric(payload: MetricPayload) {
  try {
    await connectDB();
    await Metric.create({ ...payload });
  } catch (err) {
    console.error("Failed to record metric", err);
  }
}

// Wrap any API route handler to record duration/status
export function withApiMetrics(
  handler: (req: NextRequest, ctx: { params: Record<string, string> }) => Promise<NextResponse>
) {
  return async (req: NextRequest, ctx: { params: Record<string, string> }) => {
    const start = performance.now();
    let response: NextResponse | undefined;
    let status = 500;

    try {
      response = await handler(req, ctx);
      status = response.status;
      return response;
    } catch (err) {
      status = 500;
      throw err;
    } finally {
      const duration = performance.now() - start;
      const path = req.nextUrl?.pathname || "";
      recordMetric({
        type: "api",
        name: ctx?.params ? `${req.method} ${path}` : path,
        duration,
        path,
        method: req.method,
        metadata: { status },
      });
    }
  };
}

// Measure any Mongoose/DB operation
export async function measureDb<T>(options: {
  name: string;
  collection?: string;
  path?: string;
  metadata?: Record<string, any>;
  fn: () => Promise<T>;
}): Promise<T> {
  const { name, collection, metadata, fn, path } = options;
  const start = performance.now();
  try {
    return await fn();
  } finally {
    const duration = performance.now() - start;
    recordMetric({
      type: "db",
      name,
      duration,
      path,
      metadata: { collection, ...(metadata || {}) },
    });
  }
}
