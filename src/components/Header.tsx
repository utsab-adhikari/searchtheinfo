"use client";
import { useState } from "react";
import Link from "next/link";
import { FaBars, FaTimes } from "react-icons/fa";
import { useSession } from "next-auth/react";

export default function Header() {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center">
          <Link
            href="/"
            className="font-semibold text-white text-lg sm:text-xl hover:text-zinc-200 transition-colors"
          >
            SearchThe<span className="text-emerald-400">Info</span>
          </Link>
        </div>

        {/* Hamburger button for mobile */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-zinc-400 hover:text-zinc-100 text-xl p-2 rounded-md hover:bg-zinc-800/50 transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          <a
            href="/articles"
            className="text-zinc-400 hover:text-zinc-100 px-3 lg:px-4 py-2 rounded-md hover:bg-zinc-800/50 transition-colors text-sm font-medium"
          >
            Articles
          </a>
          <a
            href="/releases"
            className="text-zinc-400 hover:text-zinc-100 px-3 lg:px-4 py-2 rounded-md hover:bg-zinc-800/50 transition-colors text-sm font-medium"
          >
            Releases
          </a>
          <a
            href="/interested"
            className="text-zinc-400 hover:text-zinc-100 px-3 lg:px-4 py-2 rounded-md hover:bg-zinc-800/50 transition-colors text-sm font-medium"
          >
            Interested
          </a>
          <a
            href="/about"
            className="text-zinc-400 hover:text-zinc-100 px-3 lg:px-4 py-2 rounded-md hover:bg-zinc-800/50 transition-colors text-sm font-medium"
          >
            About
          </a>
          {status === "authenticated" && (
            <Link
              href="/administration"
              className="ml-2 border border-zinc-700 bg-zinc-900 text-zinc-300 px-4 py-2 rounded-md hover:bg-zinc-800 hover:border-zinc-600 transition-colors text-sm font-medium"
            >
              Dashboard
            </Link>
          )}
          {(status === "unauthenticated" || status === "loading") && (
            <Link
              href="/login"
              className="ml-2 border border-emerald-600/50 bg-emerald-900/20 text-emerald-400 px-4 py-2 rounded-md hover:bg-emerald-900/30 hover:border-emerald-600 transition-colors text-sm font-medium"
            >
              Member Login
            </Link>
          )}
        </nav>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <nav className="md:hidden flex flex-col gap-1 px-4 py-3 bg-zinc-900/50 border-t border-zinc-800">
          <a
            href="/articles"
            className="text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/50 px-3 py-2 rounded-md transition-colors font-medium"
            onClick={() => setMenuOpen(false)}
          >
            Articles
          </a>
          <a
            href="/releases"
            className="text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/50 px-3 py-2 rounded-md transition-colors font-medium"
            onClick={() => setMenuOpen(false)}
          >
            Releases
          </a>
          <a
            href="/interested"
            className="text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/50 px-3 py-2 rounded-md transition-colors font-medium"
            onClick={() => setMenuOpen(false)}
          >
            Interested
          </a>
          <a
            href="/about"
            className="text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/50 px-3 py-2 rounded-md transition-colors font-medium"
            onClick={() => setMenuOpen(false)}
          >
            About
          </a>
          {status === "authenticated" ? (
            <Link
              href="/administration"
              className="mt-2 border border-zinc-700 bg-zinc-900 text-zinc-300 px-4 py-2 rounded-md hover:bg-zinc-800 transition-colors font-medium text-center"
              onClick={() => setMenuOpen(false)}
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="mt-2 border border-emerald-600/50 bg-emerald-900/20 text-emerald-400 px-4 py-2 rounded-md hover:bg-emerald-900/30 transition-colors font-medium text-center"
              onClick={() => setMenuOpen(false)}
            >
              Member Login
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
