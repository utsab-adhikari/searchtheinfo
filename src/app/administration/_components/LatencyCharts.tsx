"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
} from "recharts";

interface ApiLatencyPoint {
  path: string;
  avgDuration: number;
  p95Duration: number;
}

interface DbDurationPoint {
  bucket: string;
  name: string;
  avgDuration: number;
}

interface PageViewPoint {
  route: string;
  count: number;
}

export function ApiLatencyChart({ data }: { data: ApiLatencyPoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="path" stroke="#a1a1aa" tick={{ fontSize: 10 }} />
          <YAxis stroke="#a1a1aa" tick={{ fontSize: 10 }} unit="ms" />
          <Tooltip contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a" }} />
          <Legend />
          <Bar dataKey="avgDuration" name="Avg" fill="#22c55e" radius={[4, 4, 0, 0]} />
          <Bar dataKey="p95Duration" name="p95" fill="#22d3ee" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DbDurationChart({ data }: { data: DbDurationPoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="bucket" stroke="#a1a1aa" tick={{ fontSize: 10 }} />
          <YAxis stroke="#a1a1aa" tick={{ fontSize: 10 }} unit="ms" />
          <Tooltip contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a" }} />
          <Legend />
          <Line type="monotone" dataKey="avgDuration" stroke="#8b5cf6" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PageViewsChart({ data }: { data: PageViewPoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="route" stroke="#a1a1aa" tick={{ fontSize: 10 }} />
          <YAxis stroke="#a1a1aa" tick={{ fontSize: 10 }} />
          <Tooltip contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a" }} />
          <Bar dataKey="count" name="Views" fill="#fbbf24" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
