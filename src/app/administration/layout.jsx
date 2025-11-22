"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import LoadingUI from "../loading";

export default function Layout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;

    // Check authentication and role
    const user = session?.user;
    const isAuthorized = user?.isVerified && user?.role === "admin";

    if (user && isAuthorized) {
      setLoading(false);
    } else {
      router.replace("/auth/signin");
    }
  }, [session, status, router]);

  if (loading || status === "loading") return <LoadingUI />;

  return <>{children}</>;
}
