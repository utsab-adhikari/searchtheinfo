"use client";

import Header from "@/components/Header";

type UpdateType = "feature" | "fix" | "improvement" | "maintenance" | "release";
type UpdateScope = "admin" | "editor" | "infrastructure" | "public" | "other" | "project";

interface Update {
  id: string;
  version: string;
  title: string;
  date: string;
  displayDate: string;
  time: string;
  type: UpdateType;
  scope: UpdateScope;
  description: string;
}

const UPDATES: Update[] = [
  {
    id: "0001",
    version: "0.1.1",
    title: "Initial Test Version",
    date: "2026-01-11",
    displayDate: "jan 11, 2026",
    time: "20:30",
    type: "release",
    scope: "project",
    description:
      "First test deployment of the platform. Core infrastructure setup including Next.js framework, MongoDB database connection, authentication system, and basic routing structure.",
  },
];

const TYPE_LABELS: Record<UpdateType, string> = {
  feature: "New Feature",
  release: "Release",
  fix: "Bug Fix",
  improvement: "Improvement",
  maintenance: "Maintenance",
};

const SCOPE_LABELS: Record<UpdateScope, string> = {
  project: "Project-wide",
  admin: "Admin Workspace",
  editor: "Editor Workspace",
  infrastructure: "Infrastructure",
  public: "Public",
  other: "Other",
};

export default function ReleasesPage() {
  return (
    <div className="min-h-screen bg-zinc-950 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px] text-zinc-100">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 pt-8 md:pb-12 md:pt-10">
        {/* Header */}
        <section className="mb-8 md:mb-10">
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Releases &amp; Changelog
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-zinc-400 md:text-base leading-relaxed">
            A chronological, versioned log of production changes across{" "}
            <span className="font-semibold text-emerald-400">
              searchtheinfo.utsabadhikari.me
            </span>{" "}
            and its internal tools. Each entry reflects a real change to the
            codebase or deployment configuration.
          </p>
        </section>

        {/* Summary card */}
        <section className="mb-8 rounded-xl border border-zinc-800/50 bg-zinc-900/40 backdrop-blur-xl p-5 md:p-6 shadow-2xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs text-zinc-500 md:text-sm uppercase tracking-wider font-semibold">
                Current Production Version
              </p>
              <p className="text-2xl font-bold text-white md:text-3xl mt-1">
                v{UPDATES[0]?.version ?? "1.1.0"}
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                Released on {UPDATES[0]?.displayDate}
              </p>
            </div>
            <div className="text-xs text-zinc-400 md:text-sm max-w-md">
              <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4">
                <p className="leading-relaxed">
                  Entries on this page are maintained manually and represent the{" "}
                  <span className="font-medium text-emerald-400">
                    actual deployed state
                  </span>{" "}
                  of the platform and related services.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Updates list */}
        {UPDATES.length === 0 ? (
          <section className="rounded-xl border border-zinc-800/50 bg-zinc-900/40 backdrop-blur-xl px-6 py-12 text-center text-sm text-zinc-400 md:px-8 shadow-2xl">
            No releases have been recorded yet. Once the first production
            deployment is made, it will appear here.
          </section>
        ) : (
          <section className="relative">
            {/* Vertical timeline line (desktop only) */}
            <div className="absolute left-[22px] top-0 bottom-0 hidden w-px bg-gradient-to-b from-emerald-500/50 via-zinc-700 to-transparent md:block" />
            
            <div className="space-y-5">
              {UPDATES.map((update, idx) => {
                const isLatest = idx === 0;
                return (
                  <article
                    key={update.id}
                    className="relative rounded-xl border border-zinc-800/50 bg-zinc-900/40 backdrop-blur-xl px-5 py-5 md:px-7 md:py-6 hover:border-emerald-500/30 transition-all shadow-lg hover:shadow-emerald-500/10"
                  >
                    {/* Timeline dot (desktop) */}
                    <div 
                      className={`absolute left-[14px] top-6 hidden h-4 w-4 rounded-full border-2 md:block ${
                        isLatest 
                          ? "border-emerald-500 bg-emerald-500 shadow-lg shadow-emerald-500/50" 
                          : "border-zinc-600 bg-zinc-900"
                      }`} 
                    />

                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      {/* Left/main content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className="rounded-md border border-zinc-700/70 bg-zinc-800/50 px-2.5 py-1 text-[11px] font-mono text-zinc-300">
                            #{update.id}
                          </span>
                          <span className="rounded-md bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-bold text-emerald-400">
                            v{update.version}
                          </span>
                          <span
                            className={`rounded-md px-2.5 py-1 text-[11px] font-semibold capitalize ${
                              update.type === "feature"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                : update.type === "fix"
                                ? "bg-red-500/10 text-red-400 border border-red-500/30"
                                : update.type === "improvement"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                                : "bg-zinc-700/30 text-zinc-300 border border-zinc-700/50"
                            }`}
                          >
                            {TYPE_LABELS[update.type]}
                          </span>
                          <span className="rounded-md bg-blue-500/10 border border-blue-500/30 px-2.5 py-1 text-[11px] font-medium text-blue-400">
                            {SCOPE_LABELS[update.scope]}
                          </span>
                          {isLatest && (
                            <span className="rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-lg shadow-emerald-600/30">
                              Latest
                            </span>
                          )}
                        </div>

                        <h2 className="text-base font-bold text-white md:text-lg mb-2">
                          {update.title}
                        </h2>
                        <p className="text-sm text-zinc-400 md:text-base leading-relaxed">
                          {update.description}
                        </p>
                      </div>

                      {/* Right/date meta */}
                      <div className="text-right text-xs text-zinc-500 md:text-sm flex-shrink-0">
                        <p className="font-medium text-zinc-400">{update.displayDate}</p>
                        <p className="mt-1 opacity-70">at {update.time}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* Footer note */}
        <div className="mt-8 rounded-lg border border-zinc-800/50 bg-zinc-900/30 backdrop-blur-xl p-4">
          <p className="text-xs text-zinc-500 md:text-sm leading-relaxed">
            <span className="text-emerald-400 font-semibold">Note:</span> Each release ID is sequential (e.g., 0001, 0002, …) and tied to a
            deployed build. Internal refactors that do not affect behaviour or
            infrastructure may be grouped into a single entry. Version numbers follow semantic versioning.
          </p>
        </div>
      </div>
    </div>
  );
}