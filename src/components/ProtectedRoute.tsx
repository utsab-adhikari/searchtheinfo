"use client";

import React, { ReactNode } from "react";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";
import Link from "next/link";
import { Clock, ShieldCheck } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requireVerified?: boolean;
}

export default function ProtectedRoute({
  children,
  requireVerified = true,
}: ProtectedRouteProps) {
  const { loading, unauthenticated, user, notVerified } =
    useProtectedRoute(requireVerified);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-r-transparent" />
          <p className="mt-4 text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (unauthenticated) return null;

  if (notVerified) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="max-w-xl w-full bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
          {user?.image ? (
            <img
              src={user.image}
              alt={user.name || "User"}
              className="w-24 h-24 mx-auto rounded-full border-4 border-zinc-700 mb-6"
            />
          ) : (
            <div className="w-24 h-24 mx-auto rounded-full bg-emerald-500/20 border-4 border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-3xl mb-6">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
          )}

          <h1 className="text-2xl font-bold text-white mb-1">
            {user?.name || "User"}
          </h1>
          <p className="text-zinc-400 mb-6">{user?.email}</p>

          <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-5 mb-6 text-left">
            <div className="flex items-start gap-3">
              <Clock className="w-6 h-6 text-yellow-500 mt-1" />
              <div>
                <h2 className="text-lg font-semibold text-yellow-400 mb-1">
                  Verification Pending
                </h2>
                <p className="text-zinc-300 text-sm leading-relaxed">
                  Your account is under review. You’ll get access once approved
                  by the team.
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/"
            className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition-colors font-medium"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed top-0 right-0 z-50 p-3">
        <ShieldCheck className="w-4 h-4 text-emerald-500" />
      </div>
      {children}
    </>
  );
}
