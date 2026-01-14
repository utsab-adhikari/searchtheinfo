"use client";

import React, { useState } from "react";
import { 
  FiShare2, 
  FiCopy, 
  FiCheck, 
  FiMail 
} from "react-icons/fi";
import { 
  FaXTwitter, 
  FaLinkedinIn 
} from "react-icons/fa6";

export default function ShareMenu({ title, url, abstract }: { title: string; url: string; abstract: string }) {
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  const mailtoUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${abstract}\n\n${url}`)}`;

  async function handleNativeShare() {
    try {
      if (navigator.share) {
        await navigator.share({ title, text: abstract, url });
      } else {
        await copyLink();
      }
    } catch {
      // ignore
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <div className="relative">
      {/* Mobile: Show single share button with dropdown */}
      <div className="sm:hidden">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
          title="Share article"
        >
          <FiShare2 className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
        </button>
        
        {showMenu && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 mt-2 w-48 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-lg z-20 overflow-hidden">
              <button
                onClick={() => {
                  handleNativeShare();
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors text-sm text-zinc-700 dark:text-zinc-300"
              >
                <FiShare2 className="w-4 h-4" />
                <span>Share</span>
              </button>
              <a
                href={tweetUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowMenu(false)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors text-sm text-zinc-700 dark:text-zinc-300"
              >
                <FaXTwitter className="w-4 h-4" />
                <span>Twitter</span>
              </a>
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowMenu(false)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors text-sm text-zinc-700 dark:text-zinc-300"
              >
                <FaLinkedinIn className="w-4 h-4" />
                <span>LinkedIn</span>
              </a>
              <a
                href={mailtoUrl}
                onClick={() => setShowMenu(false)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors text-sm text-zinc-700 dark:text-zinc-300"
              >
                <FiMail className="w-4 h-4" />
                <span>Email</span>
              </a>
              <button
                onClick={() => {
                  copyLink();
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors text-sm text-zinc-700 dark:text-zinc-300"
              >
                {copied ? <FiCheck className="w-4 h-4 text-emerald-600" /> : <FiCopy className="w-4 h-4" />}
                <span>{copied ? "Copied!" : "Copy Link"}</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Desktop: Show all buttons inline */}
      <div className="hidden sm:flex items-center gap-2">
        <button
          onClick={handleNativeShare}
          className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
          title="Share"
        >
          <FiShare2 className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
        </button>
        <a
          href={tweetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
          title="Share on Twitter"
        >
          <FaXTwitter className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
        </a>
        <a
          href={linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
          title="Share on LinkedIn"
        >
          <FaLinkedinIn className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
        </a>
        <a
          href={mailtoUrl}
          className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
          title="Share via Email"
        >
          <FiMail className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
        </a>
        <button
          onClick={copyLink}
          className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
          title={copied ? "Copied!" : "Copy link"}
        >
          {copied ? (
            <FiCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <FiCopy className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
          )}
        </button>
      </div>
    </div>
  );
}