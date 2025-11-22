"use client";
import { useState } from "react";
import Link from "next/link";
import { FaBars, FaTimes } from "react-icons/fa";
import { useSession } from "next-auth/react";

export default function Header() {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-800 bg-[#0f1117]/90 backdrop-blur">
      <div className="max-w-6xl mx-auto flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/" className="font-light text-white text-lg">
            SearchThe<span className="text-emerald-400 font-medium">Info</span>
          </Link>
        </div>

        {/* Hamburger button for mobile */}
        <div className="sm:hidden flex items-center">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-gray-400 hover:text-white text-xl"
          >
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-6 text-sm">
          <a href="/articles" className="text-gray-400 hover:text-white">
            Articles
          </a>
          <a href="/domains" className="text-gray-400 hover:text-white">
            Domains
          </a>
          <a href="/interested" className="text-gray-400 hover:text-white">
            Interested?
          </a>
          <a href="/about" className="text-gray-400 hover:text-white">
            About
          </a>
         { status === "authenticated" && (
          <Link href="/administration" className="border border-gray-700 bg-[#1a1c23] px-3 py-2 rounded-md hover:border-emerald-500 transition">
            Dashboard
          </Link>
         ) }
         { (status === "unauthenticated" || status === "loading") && (
          <Link href="/auth/signin" className="border border-gray-700 bg-[#1a1c23] px-3 py-2 rounded-md hover:border-emerald-500 transition">
            Member Login
          </Link>
         )}
        </nav>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <nav className="sm:hidden flex flex-col gap-3 px-4 pb-4 bg-[#0f1117] border-t border-gray-800 transition-all">
          <a
            href="/articles"
            className="text-gray-400 hover:text-white"
            onClick={() => setMenuOpen(false)}
          >
            Articles
          </a>
          <a
            href="/domains"
            className="text-gray-400 hover:text-white"
            onClick={() => setMenuOpen(false)}
          >
            Domains
          </a>
          <a
            href="/interested"
            className="text-gray-400 hover:text-white"
            onClick={() => setMenuOpen(false)}
          >
            Interested?
          </a>
          <a
            href="/about"
            className="text-gray-400 hover:text-white"
            onClick={() => setMenuOpen(false)}
          >
            About
          </a>
          <Link href="/auth/signin" className="border border-gray-700 bg-[#1a1c23] px-3 py-2 rounded-md hover:border-emerald-500 transition">
            Member Login
          </Link>
        </nav>
      )}
    </header>
  );
}
