"use client";

import React from "react";

interface ScratchpadTabProps {
  content: string;
  onChange: (content: string) => void;
}

export default function ScratchpadTab({
  content,
  onChange,
}: ScratchpadTabProps) {
  const wordCount = content.split(/\s+/).filter(Boolean).length;

  return (
    <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800 rounded-xl p-4">
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-zinc-800">
        <div>
          <h3 className="text-sm font-semibold text-white">
            Research Scratchpad
          </h3>
          <p className="text-[10px] text-gray-400 mt-0.5">
            Write your rough research notes, ideas, and outlines here
          </p>
        </div>
      </div>

  <div className="space-y-3">
        <textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Start writing your research notes, ideas, outlines, or rough drafts here... This is your private workspace for brainstorming and organizing thoughts before structuring the final article."
          rows={16}
          className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-colors resize-none font-mono"
        />

  <div className="flex justify-between items-center text-[10px] text-gray-500">
          <div>
            {content.length} characters • {wordCount} words
          </div>
          <div>Auto-save enabled</div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <h4 className="text-blue-400 font-medium mb-1.5 text-xs">Tips</h4>
        <ul className="text-[10px] text-gray-400 space-y-0.5">
          <li>
            • Use this space for rough drafts, research notes, and brainstorming
          </li>
          <li>
            • Organize your thoughts before structuring the final article
          </li>
          <li>• Save frequently to avoid losing your work</li>
          <li>• This content is only visible to you during editing</li>
        </ul>
      </div>
    </div>
  );
}
