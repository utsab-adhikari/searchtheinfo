"use client";

import React, { useEffect, useState } from "react";
import { FiEye } from "react-icons/fi";

export default function ViewsCounter({ slug, initialViews }: { slug: string; initialViews: number }) {
  const [views, setViews] = useState<number>(initialViews);
  const [incremented, setIncremented] = useState<boolean>(false);

  useEffect(() => {
    // Basic dedupe: only increment once per slug per session (resets on browser restart)
    const key = `viewed:${slug}`;
    const already = sessionStorage.getItem(key);
    if (already) {
      setIncremented(true);
      return;
    }

    (async () => {
      try {
        const res = await fetch(`/api/articles/v1/${encodeURIComponent(slug)}/views`, { method: "PATCH" });
        const data = await res.json();
        if (res.ok && typeof data.views === "number") {
          setViews(data.views);
          sessionStorage.setItem(key, "1");
          setIncremented(true);
        }
      } catch (e) {
        // silent
      }
    })();
  }, [slug]);

  return (
    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm">
      <FiEye className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
      <span className="font-medium text-zinc-700 dark:text-zinc-300">{views.toLocaleString()}</span>
      <span className="text-zinc-500 dark:text-zinc-400">views</span>
    </div>
  );
}