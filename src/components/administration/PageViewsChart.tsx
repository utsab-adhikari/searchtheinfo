"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import type { PageViewCount } from "@/lib/monitoring/types";

interface Props {
  data: PageViewCount[];
}

export default function PageViewsChart({ data }: Props) {
  if (!data.length) {
    return <p className="text-xs text-zinc-500">No page views recorded yet.</p>;
  }

  const chartData = data.map((item) => ({
    route: item.route,
    count: item.count,
  }));

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ left: -20 }}>
          <XAxis dataKey="route" tick={{ fontSize: 10 }} interval={0} angle={-30} dy={10} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Bar dataKey="count" name="Views" fill="#22c55e" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
