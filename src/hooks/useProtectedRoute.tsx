"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Hook to enforce authentication and optionally verification.
 * @param requireVerified boolean – true to require `user.isVerified`
 */
export function useProtectedRoute(requireVerified = true) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/"); // redirect if not logged in
    }
  }, [status, router]);

  const loading = status === "loading";
  const unauthenticated = status === "unauthenticated";

  const user = session?.user as any;
  const notVerified = requireVerified && user?.isVerified === false;

  return { session, user, loading, unauthenticated, notVerified };
}
