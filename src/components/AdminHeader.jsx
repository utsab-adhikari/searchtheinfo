"use client";
import { useState } from "react";
import Link from "next/link";
import { FaArrowRightToBracket } from "react-icons/fa6";
import { FaBars, FaTimes } from "react-icons/fa";
import { useSession, signOut } from "next-auth/react";

export default function AdminHeader() {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-800 bg-[#0f1117]/90 backdrop-blur">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 sm:px-8 py-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Link href="/" className="font-light text-white text-lg">
            SearchThe<span className="text-emerald-400 font-medium">Info</span>
          </Link>
          <p className="hidden sm:block text-gray-400 text-sm">
            Administration Dashboard
          </p>
        </div>

        {/* Mobile Hamburger */}
        <div className="sm:hidden flex items-center">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-gray-400 hover:text-white text-xl"
          >
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden sm:flex items-center gap-6 text-sm">
          <Link
            href="/administration"
            className="text-gray-400 hover:text-white transition"
          >
            Dashboard
          </Link>
          <Link
            href="/administration/interested"
            className="text-gray-400 hover:text-white transition"
          >
            Interested
          </Link>

          {status === "authenticated" && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-[#1a1c23] border border-gray-700 px-3 py-2 rounded-md text-gray-300 hover:border-emerald-500 hover:text-white transition"
            >
              <FaArrowRightToBracket className="h-4 w-4 rotate-180" />
              Logout
            </button>
          )}
        </nav>
      </div>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <nav className="sm:hidden flex flex-col gap-3 px-4 pb-4 bg-[#0f1117] border-t border-gray-800">
          <Link
            href="/administration"
            className="text-gray-400 hover:text-white"
            onClick={() => setMenuOpen(false)}
          >
            Dashboard
          </Link>
          <Link
            href="/administration/interested"
            className="text-gray-400 hover:text-white"
            onClick={() => setMenuOpen(false)}
          >
            Interested
          </Link>

          {status === "authenticated" && (
            <button
              onClick={() => {
                setMenuOpen(false);
                handleLogout();
              }}
              className="flex items-center gap-2 bg-[#1a1c23] border border-gray-700 px-3 py-2 rounded-md text-gray-300 hover:border-emerald-500 hover:text-white transition"
            >
              <FaArrowRightToBracket className="h-4 w-4 rotate-180" />
              Logout
            </button>
          )}
        </nav>
      )}
    </header>
  );
}
