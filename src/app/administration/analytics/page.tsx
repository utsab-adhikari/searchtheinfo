import Link from "next/link";
import { Activity, Globe2, MapPin, Users } from "lucide-react";
import { getRealtimeOverview, getTrafficOverview } from "@/lib/analytics/googleAnalytics";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const [realtime, traffic] = await Promise.all([
    getRealtimeOverview(),
    getTrafficOverview(),
  ]);

  return (
    <div className="max-w-[1920px] mx-auto space-y-6 pb-8 relative">
      <div className="hidden md:flex items-center gap-2 text-xs text-zinc-500 mb-2">
        <span>Dashboard</span>
        <span className="mx-2">/</span>
        <span>Administration</span>
        <span className="mx-2">/</span>
        <span className="text-emerald-400">Analytics</span>
      </div>

      <div className="space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-full" />
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Google Analytics
              </h1>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Overview of active users, traffic, and top pages from GA4.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/administration"
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg text-xs font-medium transition-all"
            >
              <Activity className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">System Monitoring</span>
            </Link>
          </div>
        </header>

        {!realtime && !traffic ? (
          <div className="text-xs text-zinc-500 bg-zinc-900/60 border border-zinc-800 rounded-lg p-4">
            Google Analytics is not configured. Set <code>GA4_PROPERTY_ID</code>,
            <code>GA4_CLIENT_EMAIL</code>, and <code>GA4_PRIVATE_KEY</code> in your
            environment to enable this page.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-3 shadow-sm">
                <p className="text-[11px] font-medium text-zinc-400">Active users (realtime)</p>
                <h3 className="text-lg font-bold text-white mt-1">
                  {realtime?.activeUsers ?? 0}
                </h3>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-3 shadow-sm">
                <p className="text-[11px] font-medium text-zinc-400">Users (last 7 days)</p>
                <h3 className="text-lg font-bold text-white mt-1">
                  {traffic?.totalUsers ?? 0}
                </h3>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-3 shadow-sm">
                <p className="text-[11px] font-medium text-zinc-400">Page views (last 7 days)</p>
                <h3 className="text-lg font-bold text-white mt-1">
                  {traffic?.totalPageViews ?? 0}
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <section className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/30 rounded-xl p-4 shadow-lg shadow-black/30">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                    <Globe2 className="w-4 h-4 text-sky-400" />
                    Top countries (7d)
                  </h3>
                </div>
                <div className="space-y-2 text-xs max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                  {traffic?.byCountry?.length ? (
                    traffic.byCountry.map((row) => (
                      <div
                        key={row.country}
                        className="flex items-center justify-between py-1 border-b border-zinc-800/40 last:border-0"
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3 h-3 text-zinc-500" />
                          <span className="text-zinc-200">{row.country}</span>
                        </div>
                        <span className="text-zinc-400">{row.users.toLocaleString()}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-zinc-500">No country data.</p>
                  )}
                </div>
              </section>

              <section className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/30 rounded-xl p-4 shadow-lg shadow-black/30">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    Top pages (realtime & 7d)
                  </h3>
                </div>
                <div className="space-y-3 text-xs max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                  <div>
                    <p className="text-[11px] font-medium text-zinc-500 mb-1">
                      Realtime
                    </p>
                    {realtime?.topPages?.length ? (
                      realtime.topPages.map((row) => (
                        <div
                          key={row.pagePath + "-rt"}
                          className="flex items-center justify-between py-1 border-b border-zinc-800/40 last:border-0"
                        >
                          <span className="text-zinc-200 truncate max-w-[220px]">
                            {row.pagePath}
                          </span>
                          <span className="text-zinc-400">
                            {row.activeUsers.toLocaleString()}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-zinc-500">No realtime page data.</p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-zinc-800/60">
                    <p className="text-[11px] font-medium text-zinc-500 mb-1">
                      Last 7 days
                    </p>
                    {traffic?.byPage?.length ? (
                      traffic.byPage.map((row) => (
                        <div
                          key={row.pagePath + "-7d"}
                          className="flex items-center justify-between py-1 border-b border-zinc-800/40 last:border-0"
                        >
                          <span className="text-zinc-200 truncate max-w-[220px]">
                            {row.pagePath}
                          </span>
                          <span className="text-zinc-400">
                            {row.pageViews.toLocaleString()}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-zinc-500">No 7d page data.</p>
                    )}
                  </div>
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
