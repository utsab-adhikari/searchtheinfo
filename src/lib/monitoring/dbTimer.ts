import { logMetric } from "./logger";
import type { DbTimingOptions, MetricStatus } from "./types";

/**
 * Measure MongoDB / Mongoose query execution time.
 * Wrap any async DB operation with this helper.
 */
export async function withDbTiming<T>(
  name: string,
  operation: () => Promise<T>,
  metadata?: Record<string, unknown>,
  options?: DbTimingOptions
): Promise<T> {
  const thresholdMs = options?.thresholdMs ?? 50;
  const start = process.hrtime.bigint();

  try {
    const result = await operation();
    const durationNs = process.hrtime.bigint() - start;
    const durationMs = Number(durationNs) / 1_000_000;

    const status: MetricStatus = "success";

    void logMetric({
      type: "db",
      name,
      duration: durationMs,
      status,
      metadata: {
        ...(metadata || {}),
        isSlow: durationMs >= thresholdMs,
      },
    });

    return result;
  } catch (error) {
    const durationNs = process.hrtime.bigint() - start;
    const durationMs = Number(durationNs) / 1_000_000;

    void logMetric({
      type: "db",
      name,
      duration: durationMs,
      status: "error",
      metadata: {
        ...(metadata || {}),
        isSlow: true,
        errorMessage:
          error instanceof Error ? error.message : "Unknown error",
      },
    });

    throw error;
  }
}
