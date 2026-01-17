import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  BarChart2,
  Clock,
  Database,
  Eye,
  FilePlus,
  FileText,
  Users,
} from "lucide-react";
import connectDB from "@/database/connectDB";
import Metric from "@/models/Metric";
import ActivityLog from "@/models/ActivityLog";
import type {
  AggregatedApiLatency,
  DbDurationPoint,
  PageViewCount,
} from "@/lib/monitoring/types";
import ApiLatencyChart from "@/components/administration/ApiLatencyChart";
import DbDurationChart from "@/components/administration/DbDurationChart";
import PageViewsChart from "@/components/administration/PageViewsChart";

export const dynamic = "force-dynamic";

async function getApiLatency(): Promise<AggregatedApiLatency[]> {
  await connectDB();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const raw = await Metric.aggregate<{
    _id: string | null;
    avgDuration: number;
    durations: number[];
    count: number;
  }>([
    { $match: { type: "api", createdAt: { $gte: since } } },
    {
      $group: {
        _id: "$metadata.path",
        avgDuration: { $avg: "$duration" },
        durations: { $push: "$duration" },
        count: { $sum: 1 },
      },
    },
  ]);

  return raw
    .filter((doc) => !!doc._id)
    .map((doc) => {
      const durations = (doc.durations || []).filter(
        (d) => typeof d === "number",
      );
      durations.sort((a, b) => a - b);
      const p95Index = durations.length
        ? Math.floor(0.95 * (durations.length - 1))
        : 0;
      const p95Duration = durations[p95Index] ?? 0;

      return {
        path: doc._id as string,
        avgDuration: doc.avgDuration ?? 0,
        p95Duration,
        count: doc.count ?? 0,
      };
    })
    .sort((a, b) => b.avgDuration - a.avgDuration)
    .slice(0, 10);
}

async function getDbTrends(): Promise<DbDurationPoint[]> {
  await connectDB();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const raw = await Metric.aggregate<{
    _id: { day: string; name: string };
    avgDuration: number;
  }>([
    { $match: { type: "db", createdAt: { $gte: since } } },
    {
      $group: {
        _id: {
          day: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          name: "$name",
        },
        avgDuration: { $avg: "$duration" },
      },
    },
    { $sort: { "_id.day": 1 } },
  ]);

  return raw.map((doc) => ({
    bucket: doc._id.day,
    name: doc._id.name,
    avgDuration: doc.avgDuration ?? 0,
  }));
}

async function getRecentErrors() {
  await connectDB();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const metrics = await Metric.find({
    type: { $in: ["api", "db"] },
    createdAt: { $gte: since },
    $or: [{ status: "error" }, { status: { $regex: "^5" } }],
  })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  return metrics.map((m) => ({
    id: String(m._id),
    name: m.name,
    type: m.type,
    status: m.status,
    path: (m as any).metadata?.path,
    createdAt: m.createdAt,
    errorMessage: (m as any).metadata?.errorMessage,
  }));
}

async function getPageViews(): Promise<PageViewCount[]> {
  await connectDB();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const raw = await ActivityLog.aggregate<{
    _id: string;
    count: number;
  }>([
    { $match: { action: "view", createdAt: { $gte: since } } },
    {
      $group: {
        _id: "$route",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  return raw.map((doc) => ({ route: doc._id, count: doc.count }));
}

async function getDbOverview() {
  const db = await connectDB();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const totalQueries = await Metric.countDocuments({
    type: "db",
    createdAt: { $gte: since },
  });

  const slowQueries = await Metric.countDocuments({
    type: "db",
    createdAt: { $gte: since },
    "metadata.isSlow": true,
  });

  const stateMap: Record<number, string> = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  const state = db.connection.readyState;

  return {
    status: stateMap[state] ?? "unknown",
    host: db.connection.host,
    name: db.connection.name,
    totalQueries,
    slowQueries,
  };
}

export default async function AdministrationHome() {
  const [apiLatency, dbTrends, recentErrors, pageViews, dbOverview] =
    await Promise.all([
      getApiLatency(),
      getDbTrends(),
      getRecentErrors(),
      getPageViews(),
      getDbOverview(),
    ]);

  const totalApiCalls = apiLatency.reduce((sum, item) => sum + item.count, 0);
  const avgApiLatency =
    totalApiCalls > 0
      ? apiLatency.reduce(
          (sum, item) => sum + item.avgDuration * item.count,
          0,
        ) / totalApiCalls
      : 0;

  const totalPageViews = pageViews.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="max-w-[1920px] mx-auto space-y-6 pb-8 relative">
      <div className="hidden md:flex items-center gap-2 text-xs text-zinc-500 mb-2">
        <span>Dashboard</span>
        <span className="mx-2">/</span>
        <span className="text-emerald-400">Monitoring</span>
      </div>

      <div className="space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-full" />
              <h1 className="text-2xl font-bold text-white tracking-tight">
                System Monitoring
              </h1>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              API latency, database performance, errors, and page views
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/administration/users"
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg text-xs font-medium transition-all"
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Users</span>
            </Link>
            <Link
              href="/administration/articles"
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg text-xs font-medium transition-all"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Articles</span>
            </Link>
            <Link
              href="/editor/new"
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm shadow-emerald-900/20"
            >
              <FilePlus className="w-3.5 h-3.5" />
              New Article
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<BarChart2 className="w-4 h-4 text-emerald-400" />}
            label="Avg API Latency"
            value={`${avgApiLatency.toFixed(1)} ms`}
          />
          <StatCard
            icon={<Activity className="w-4 h-4 text-blue-400" />}
            label="Tracked API Routes"
            value={apiLatency.length}
          />
          <StatCard
            icon={<Eye className="w-4 h-4 text-amber-400" />}
            label="Page Views (7d)"
            value={totalPageViews}
          />
          <StatCard
            icon={<AlertTriangle className="w-4 h-4 text-rose-400" />}
            label="Errors (7d)"
            value={recentErrors.length}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <section className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/30 rounded-xl overflow-hidden shadow-lg shadow-black/30">
              <div className="p-4 border-b border-zinc-800/30 flex items-center justify-between">
                <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-emerald-400" />
                  API Latency (last 24h)
                </h3>
              </div>
              <div className="p-4">
                <ApiLatencyChart data={apiLatency} />
              </div>
            </section>

            <section className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/30 rounded-xl overflow-hidden shadow-lg shadow-black/30">
              <div className="p-4 border-b border-zinc-800/30 flex items-center justify-between">
                <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  DB Query Duration Trends (7d)
                </h3>
              </div>
              <div className="p-4">
                <DbDurationChart data={dbTrends} />
              </div>
            </section>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <section className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/30 rounded-xl p-4 shadow-lg shadow-black/30">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                  <Database className="w-4 h-4 text-sky-400" />
                  Database
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs text-zinc-400">
                <div>
                  <p className="text-[11px]">Status</p>
                  <p className="text-sm font-semibold text-zinc-100 capitalize">
                    {dbOverview.status}
                  </p>
                </div>
                <div>
                  <p className="text-[11px]">Database</p>
                  <p className="text-sm font-semibold text-zinc-100">
                    {dbOverview.name}
                  </p>
                </div>
                <div>
                  <p className="text-[11px]">Host</p>
                  <p className="text-[11px] text-zinc-300 truncate">
                    {dbOverview.host}
                  </p>
                </div>
                <div>
                  <p className="text-[11px]">Queries (24h)</p>
                  <p className="text-sm font-semibold text-zinc-100">
                    {dbOverview.totalQueries}
                  </p>
                </div>
                <div>
                  <p className="text-[11px]">Slow queries (24h)</p>
                  <p className="text-sm font-semibold text-zinc-100">
                    {dbOverview.slowQueries}
                  </p>
                </div>
              </div>
            </section>
            <section className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/30 rounded-xl p-4 shadow-lg shadow-black/30">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  Recent Errors
                </h3>
              </div>
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar text-xs">
                {recentErrors.length === 0 && (
                  <p className="text-zinc-500">
                    No errors recorded in the last 7 days.
                  </p>
                )}
                {recentErrors.map((err) => (
                  <div
                    key={err.id}
                    className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/50 flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-zinc-200">
                        {err.name}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {new Date(err.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-400">
                      {(err.type || "").toUpperCase()} • {err.status}
                      {err.path ? ` • ${err.path}` : ""}
                    </span>
                    {err.errorMessage && (
                      <span className="text-[11px] text-zinc-500 line-clamp-2">
                        {err.errorMessage}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/30 rounded-xl p-4 shadow-lg shadow-black/30">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-amber-400" />
                  Page Views (7d)
                </h3>
              </div>
              <PageViewsChart data={pageViews} />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-3 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="p-1.5 bg-zinc-900/80 rounded-lg border border-zinc-800/80">
          {icon}
        </div>
      </div>
      <p className="text-[11px] font-medium text-zinc-400 mt-1.5">{label}</p>
      <h3 className="text-lg font-bold text-white mt-1">{value}</h3>
    </div>
  );
}
