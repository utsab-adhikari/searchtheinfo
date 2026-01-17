import { NextRequest, NextResponse } from "next/server";
import { logMetric } from "@/lib/monitoring/logger";
import type { MetricKind } from "@/lib/monitoring/types";
import { withApiTimingSimple } from "@/lib/monitoring/apiTimer";

interface WebVitalPayload {
  name: string; // e.g. LCP, FID
  value: number;
  id?: string;
  label?: string;
  path: string;
  type?: MetricKind;
}

async function handlePost(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const events: WebVitalPayload[] = Array.isArray(body) ? body : [body];

    await Promise.all(
      events.map((event) =>
        logMetric({
          type: event.type || "frontend",
          name: event.name,
          duration: event.value,
          metadata: {
            path: event.path,
            id: event.id,
            label: event.label,
            source: "web-vitals",
          },
        })
      )
    );

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to ingest web vitals" },
      { status: 400 }
    );
  }
}

export const POST = withApiTimingSimple(
  "metrics-web-vitals-post",
  handlePost
);
