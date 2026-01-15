import { NextRequest, NextResponse } from "next/server";
import { recordMetric } from "@/lib/metrics/server";

export async function POST(req: NextRequest) {
  const { name, duration, path, method, metadata } = await req.json();
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  await recordMetric({ type: "api", name, duration, path, method, metadata });
  return NextResponse.json({ ok: true });
}
