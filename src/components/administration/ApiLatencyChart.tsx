"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import type { AggregatedApiLatency } from "@/lib/monitoring/types";

interface Props {
  data: AggregatedApiLatency[];
}

export default function ApiLatencyChart({ data }: Props) {
  if (!data.length) {
    return <p className="text-xs text-zinc-500">No API metrics recorded yet.</p>;
  }

  const chartData = data.map((item) => ({
    path: item.path,
    avg: Number(item.avgDuration.toFixed(1)),
    p95: Number(item.p95Duration.toFixed(1)),
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ left: -20 }}>
          <XAxis dataKey="path" tick={{ fontSize: 10 }} interval={0} angle={-30} dy={10} />
          <YAxis tick={{ fontSize: 10 }} unit=" ms" />
          <Tooltip formatter={(value: number | string) => `${value} ms`} />
          <Legend />
          <Bar dataKey="avg" name="Avg" fill="#22c55e" radius={[4, 4, 0, 0]} />
          <Bar dataKey="p95" name="p95" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
