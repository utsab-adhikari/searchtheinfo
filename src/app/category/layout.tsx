"use client";
import { LogOut, Menu, X } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: session, status } = useSession();
  const user = session?.user as any;

  return (
    <ProtectedRoute requireVerified={true}>
    {children}
    </ProtectedRoute>
  );
}
