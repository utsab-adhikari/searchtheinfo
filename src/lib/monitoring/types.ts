export type MetricKind = "frontend" | "api" | "db";

export type MetricStatus = "success" | "error" | string;

export interface MetricInput {
  type: MetricKind;
  name: string;
  duration?: number; // milliseconds
  status?: MetricStatus;
  metadata?: Record<string, unknown>;
}

export type ActivityRole = "guest" | "editor" | "admin";

export type ActivityAction = "view" | "create" | "update" | "delete";

export interface ActivityLogInput {
  userId?: string | null;
  role: ActivityRole;
  action: ActivityAction;
  route: string;
  ip: string;
  userAgent: string;
  metadata?: Record<string, unknown>;
}

export interface ApiMetricPayload extends MetricInput {
  path?: string;
  method?: string;
}

export interface DbTimingOptions {
  /** Threshold above which a query is considered slow (ms) */
  thresholdMs?: number;
}

export interface AggregatedApiLatency {
  path: string;
  avgDuration: number;
  p95Duration: number;
  count: number;
}

export interface DbDurationPoint {
  bucket: string; // e.g. "2026-01-17T10:00:00Z"
  name: string;
  avgDuration: number;
}

export interface PageViewCount {
  route: string;
  count: number;
}
