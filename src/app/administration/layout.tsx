"use client";
import {
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  FileText,
  ImageIcon,
  Users,
  BarChart3,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  Clock,
  Activity,
  AlertTriangle,
  Eye,
} from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import React, { useState, useEffect, useRef } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/administration" },
  { label: "Articles", icon: FileText, href: "/administration/articles" },
  { label: "Media Library", icon: ImageIcon, href: "/administration/media" },
  { label: "User Control", icon: Users, href: "/administration/users" },
  { label: "Interested", icon: BarChart3, href: "/administration/interested" },
  {
    label: "System Settings",
    icon: Settings,
    href: "/administration/settings",
  },
];

export default function AdministrationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 flex relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        />
      )}

      {/* SIDEBAR - Enhanced with smoother animations */}
      <aside
        className={`fixed lg:relative z-50 h-screen bg-zinc-950/90 border-r border-zinc-800/30 backdrop-blur-xl transition-all duration-300 ease-in-out ${
          collapsed ? "w-20" : "w-64"
        } ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } top-16 lg:top-0`}
      >
        <div className="flex flex-col h-full relative">
          {/* Collapse toggle - desktop only */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex absolute -right-2.5 top-16 w-5 h-8 items-center justify-center bg-zinc-900 border border-zinc-800 rounded-r-lg text-zinc-500 hover:text-emerald-400 hover:border-emerald-500/30 transition-all z-10"
          >
            {collapsed ? (
              <ChevronRight className="w-3 h-3" />
            ) : (
              <ChevronLeft className="w-3 h-3" />
            )}
          </button>

          <div className={`p-4 ${collapsed ? "px-4" : ""}`}>
            <Link
              href="/"
              className={`flex items-center gap-2 text-lg font-bold text-white ${
                collapsed ? "justify-center" : ""
              }`}
            >
              {collapsed ? (
                <span className="text-emerald-500/90">S</span>
              ) : (
                <div className="font-semibold text-white text-lg sm:text-xl hover:text-zinc-200 transition-colors">
                  SearchThe<span className="text-emerald-400">Info</span>
                </div>
              )}
            </Link>
          </div>

          <nav
            className={`space-y-1 flex-1 overflow-y-auto px-2 py-4 ${
              collapsed ? "items-center" : ""
            }`}
          >
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : ""}
                  className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                    isActive
                      ? "text-white bg-emerald-500/10 border-l-2 border-emerald-500"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                  } ${collapsed ? "justify-center w-10 mx-auto" : "pl-4"}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon
                    className={`w-4 h-4 ${
                      isActive
                        ? "text-emerald-400"
                        : "text-zinc-500 group-hover:text-emerald-400 transition-colors"
                    }`}
                  />
                  {!collapsed && <span>{item.label}</span>}

                  {/* Tooltip for collapsed state */}
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-[11px] font-medium text-zinc-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg">
                      {item.label}
                    </div>
                  )}

                  {/* Active indicator dot */}
                  {isActive && !collapsed && (
                    <div className="absolute right-3 w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                  )}
                </Link>
              );
            })}
          </nav>

          <div
            className={`p-4 border-t border-zinc-800/30 ${
              collapsed ? "px-3" : ""
            }`}
          >
            {!collapsed && (
              <div className="flex items-center gap-3 px-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-black font-bold text-[10px] uppercase">
                  {user?.name?.substring(0, 2)}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-zinc-200 truncate">
                    {user?.name}
                  </p>
                  <p className="text-[11px] text-emerald-400/80 font-medium flex items-center gap-1">
                    <ShieldCheck className="w-2.5 h-2.5" /> Admin
                  </p>
                </div>
              </div>
            )}
            {collapsed && (
              <div className="flex justify-center mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-black font-bold text-[10px] uppercase">
                  {user?.name?.substring(0, 2)}
                </div>
              </div>
            )}
            <button
              onClick={() => signOut()}
              title={collapsed ? "Sign Out" : ""}
              className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[13px] font-medium group transition-colors ${
                collapsed ? "justify-center" : ""
              }`}
            >
              <LogOut
                className={`w-4 h-4 ${
                  collapsed ? "mx-auto" : ""
                } text-zinc-400 group-hover:text-rose-400 transition-colors`}
              />
              {!collapsed && (
                <span className="text-zinc-400 group-hover:text-rose-400">
                  Sign Out
                </span>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA - with smooth scroll */}
      <main className="flex-1 pt-16 lg:pt-0 h-screen overflow-y-auto relative">
        <div className="p-4 sm:p-6">
          <ProtectedRoute>{children}</ProtectedRoute>
        </div>
      </main>
    </div>
  );
}
