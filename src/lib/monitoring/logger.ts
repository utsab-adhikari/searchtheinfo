import connectDB from "@/database/connectDB";
import Metric from "@/models/Metric";
import ActivityLog from "@/models/ActivityLog";
import type { ActivityLogInput, MetricInput } from "./types";

/**
 * Persist a metric document. Errors are swallowed to keep monitoring non-blocking.
 */
export async function logMetric(input: MetricInput): Promise<void> {
  try {
    await connectDB();
    await Metric.create(input);
  } catch {
    // Intentionally ignore logging failures to avoid impacting request flow
  }
}

/**
 * Persist an activity log document. Errors are swallowed to keep monitoring non-blocking.
 */
export async function logActivity(input: ActivityLogInput): Promise<void> {
  try {
    await connectDB();
    await ActivityLog.create(input);
  } catch {
    // Intentionally ignore logging failures to avoid impacting request flow
  }
}
