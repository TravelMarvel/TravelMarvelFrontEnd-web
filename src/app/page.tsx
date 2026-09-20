"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/contexts/auth-context";

export default function HomePage() {
  const { isAuthenticated, isAuthLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthLoading) return;
    router.replace(isAuthenticated ? "/marvel" : "/login");
  }, [isAuthenticated, isAuthLoading, router]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-white">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#F26522]/30 border-t-[#F26522]" />
    </div>
  );
}
