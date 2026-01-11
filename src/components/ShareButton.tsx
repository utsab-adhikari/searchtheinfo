"use client";

import React, { useState } from "react";
import { FaShareAlt, FaFacebook, FaTwitter, FaLinkedin, FaLink } from "react-icons/fa";

export default function ShareButton({ articleTitle, slug }: { articleTitle: string; slug?: string }) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  const shareUrls = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(articleTitle)}&url=${encodeURIComponent(currentUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`,
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 rounded-lg hover:border-emerald-500/60 transition-colors"
      >
        <FaShareAlt />
        <span>Share</span>
      </button>

      {showMenu && (
        <div className="absolute right-0 bottom-full mb-2 bg-[#0f131d] border border-zinc-800 rounded-lg shadow-xl p-3 min-w-[200px] z-50">
          <div className="flex flex-col gap-2">
            <a
              href={shareUrls.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-200 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
              onClick={() => setShowMenu(false)}
            >
              <FaTwitter className="text-blue-400" />
              <span>Twitter</span>
            </a>
            <a
              href={shareUrls.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-200 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
              onClick={() => setShowMenu(false)}
            >
              <FaFacebook className="text-blue-600" />
              <span>Facebook</span>
            </a>
            <a
              href={shareUrls.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-200 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
              onClick={() => setShowMenu(false)}
            >
              <FaLinkedin className="text-blue-500" />
              <span>LinkedIn</span>
            </a>
            <button
              type="button"
              onClick={copyToClipboard}
              className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-200 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
            >
              <FaLink className="text-emerald-400" />
              <span>{copied ? "Copied!" : "Copy Link"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
