import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/database/connectDB";
import Metric from "@/models/metricModel";
import { measureDb, withApiMetrics } from "@/lib/metrics/server";

async function handler(req: NextRequest) {
  await connectDB();

  const total = await measureDb({
    name: "metrics-count",
    collection: Metric.collection.name,
    path: req.nextUrl.pathname,
    fn: () => Metric.countDocuments(),
  });

  return NextResponse.json({ ok: true, total });
}

export const GET = withApiMetrics(handler);
