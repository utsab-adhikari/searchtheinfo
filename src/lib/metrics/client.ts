type ClientMetricPayload = {
  type: "webvital" | "navigation";
  name: string;
  duration?: number;
  path?: string;
  metadata?: Record<string, any>;
};

export async function sendClientMetric(payload: ClientMetricPayload) {
  try {
    await fetch(`/api/metrics/${payload.type}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch (err) {
    // swallow errors to avoid impacting UX
    console.error("Metric send failed", err);
  }
}
