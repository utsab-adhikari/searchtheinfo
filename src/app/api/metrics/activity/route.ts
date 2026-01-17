import { NextRequest, NextResponse } from "next/server";
import { logActivity } from "@/lib/monitoring/logger";
import type { ActivityLogInput } from "@/lib/monitoring/types";
import { withApiTimingSimple } from "@/lib/monitoring/apiTimer";

async function handlePost(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const events: ActivityLogInput[] = Array.isArray(body) ? body : [body];

    await Promise.all(
      events.map((event) =>
        logActivity({
          ...event,
          userId: event.userId ?? null,
        })
      )
    );

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to record activity" },
      { status: 400 }
    );
  }
}

export const POST = withApiTimingSimple(
  "metrics-activity-post",
  handlePost
);
