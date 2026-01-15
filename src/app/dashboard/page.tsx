"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";

// Basic card wrapper
function CardShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-sm">
      <div className="mb-3 text-sm font-semibold text-zinc-200">{title}</div>
      <div className="h-64 w-full">{children}</div>
    </div>
  );
}

type Metric = {
  _id: string;
  type: "webvital" | "navigation" | "api" | "db";
  name: string;
  duration?: number;
  path?: string;
  method?: string;
  metadata?: Record<string, any>;
  createdAt: string;
};

function formatTimeLabel(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/metrics/all?limit=200");
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load metrics");
        setMetrics(data.metrics || []);
      } catch (err: any) {
        setError(err.message || "Failed to load metrics");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const apiLatency = useMemo(
    () =>
      metrics
        .filter((m) => m.type === "api" && m.duration != null)
        .map((m) => ({ time: formatTimeLabel(m.createdAt), duration: m.duration, path: m.path || m.name })),
    [metrics]
  );

  const dbLatency = useMemo(
    () =>
      metrics
        .filter((m) => m.type === "db" && m.duration != null)
        .map((m) => ({ time: formatTimeLabel(m.createdAt), duration: m.duration, collection: m.metadata?.collection || "" })),
    [metrics]
  );

  const pageLoad = useMemo(
    () =>
      metrics
        .filter((m) => m.type === "webvital" && m.duration != null)
        .map((m) => ({ time: formatTimeLabel(m.createdAt), duration: m.duration, name: m.name })),
    [metrics]
  );

  const requestsPerMinute = useMemo(() => {
    const bucket: Record<string, number> = {};
    metrics.forEach((m) => {
      const d = new Date(m.createdAt);
      const key = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
      bucket[key] = (bucket[key] || 0) + 1;
    });
    return Object.entries(bucket).map(([time, count]) => ({ time, count }));
  }, [metrics]);

  if (loading) {
    return <div className="p-8 text-zinc-200">Loading metrics…</div>;
  }

  if (error) {
    return <div className="p-8 text-red-400">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Observability Dashboard</h1>
        <p className="text-sm text-zinc-400">Frontend, API, and database latency at a glance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
          <div className="text-xs text-zinc-500">Total metrics</div>
          <div className="text-2xl font-semibold">{metrics.length}</div>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
          <div className="text-xs text-zinc-500">API samples</div>
          <div className="text-2xl font-semibold">{apiLatency.length}</div>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
          <div className="text-xs text-zinc-500">DB samples</div>
          <div className="text-2xl font-semibold">{dbLatency.length}</div>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
          <div className="text-xs text-zinc-500">Web Vitals</div>
          <div className="text-2xl font-semibold">{pageLoad.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <CardShell title="API latency (ms)">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={apiLatency} margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="time" stroke="#a1a1aa" />
              <YAxis stroke="#a1a1aa" />
              <Tooltip contentStyle={{ background: "#0b0b0f", border: "1px solid #27272a" }} />
              <Line type="monotone" dataKey="duration" stroke="#34d399" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardShell>

        <CardShell title="DB latency (ms)">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dbLatency} margin={{ left: 8, right: 8 }}>
              <defs>
                <linearGradient id="dbGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="time" stroke="#a1a1aa" />
              <YAxis stroke="#a1a1aa" />
              <Tooltip contentStyle={{ background: "#0b0b0f", border: "1px solid #27272a" }} />
              <Area type="monotone" dataKey="duration" stroke="#60a5fa" fillOpacity={1} fill="url(#dbGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardShell>

        <CardShell title="Web Vitals (ms)">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={pageLoad} margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="time" stroke="#a1a1aa" />
              <YAxis stroke="#a1a1aa" />
              <Tooltip contentStyle={{ background: "#0b0b0f", border: "1px solid #27272a" }} />
              <Line type="monotone" dataKey="duration" stroke="#22d3ee" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardShell>

        <CardShell title="Requests per minute">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={requestsPerMinute} margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="time" stroke="#a1a1aa" />
              <YAxis stroke="#a1a1aa" allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#0b0b0f", border: "1px solid #27272a" }} />
              <Bar dataKey="count" fill="#fbbf24" />
            </BarChart>
          </ResponsiveContainer>
        </CardShell>
      </div>
    </div>
  );
}
