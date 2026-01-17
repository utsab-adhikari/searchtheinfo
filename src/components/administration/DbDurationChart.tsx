"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import type { DbDurationPoint } from "@/lib/monitoring/types";

interface Props {
  data: DbDurationPoint[];
}

export default function DbDurationChart({ data }: Props) {
  if (!data.length) {
    return <p className="text-xs text-zinc-500">No DB metrics recorded yet.</p>;
  }

  const grouped: Record<string, { bucket: string; [name: string]: number | string }> = {};

  for (const point of data) {
    if (!grouped[point.bucket]) {
      grouped[point.bucket] = { bucket: point.bucket };
    }
    grouped[point.bucket][point.name] = Number(point.avgDuration.toFixed(1));
  }

  const chartData = Object.values(grouped);
  const seriesNames = Array.from(
    new Set(data.map((d) => d.name))
  );

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ left: -20 }}>
          <XAxis dataKey="bucket" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} unit=" ms" />
          <Tooltip formatter={(value: number | string) => `${value} ms`} />
          <Legend />
          {seriesNames.map((name, idx) => (
            <Line
              key={name}
              type="monotone"
              dataKey={name}
              name={name}
              stroke={COLORS[idx % COLORS.length]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

const COLORS = ["#22c55e", "#3b82f6", "#eab308", "#f97316", "#ec4899"];
