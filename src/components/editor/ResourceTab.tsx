"use client";
import React from "react";
import { Youtube, Book, Globe, Plus } from "lucide-react";

export default function ResourceTab({ data }: { data: any }) {
  return (
    <div className="space-y-8">
      <div className="bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-2xl flex items-center justify-between">
        <div>
          <h3 className="text-white font-bold">Learning Path</h3>
          <p className="text-zinc-500 text-sm">Estimated effort for this research module.</p>
        </div>
        <div className="flex items-center gap-2 text-2xl font-black text-emerald-400">
          <span>{data?.daysToComplete || 0}</span>
          <span className="text-xs uppercase font-medium text-zinc-600 tracking-tighter">Days</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Youtube Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-zinc-400 font-bold text-xs uppercase">
            <Youtube className="w-4 h-4 text-red-500" /> Videos
          </div>
          <button className="w-full py-2 border border-dashed border-zinc-800 rounded-xl text-zinc-600 hover:text-zinc-400 transition-colors text-xs flex items-center justify-center gap-2">
            <Plus className="w-3 h-3" /> Add Video URL
          </button>
        </div>
        {/* ... Similar blocks for Books and Sites ... */}
      </div>
    </div>
  );
}