import { NextWebVitalsMetric } from "next/app";
import { sendClientMetric } from "@/lib/metrics/client";

export function reportWebVitals(metric: NextWebVitalsMetric) {
  const { id, name, value } = metric;
  sendClientMetric({
    type: "webvital",
    name,
    duration: value,
    path: window.location.pathname,
    metadata: { id },
  });
}
