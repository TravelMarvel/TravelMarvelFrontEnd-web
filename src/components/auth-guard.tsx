"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { BottomTabBar } from "@/components/bottom-tab-bar";
import { useAuth } from "@/contexts/auth-context";

export function AuthGuard({
  children,
  withTabs = false,
}: {
  children: React.ReactNode;
  withTabs?: boolean;
}) {
  const { isAuthenticated, isAuthLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthLoading, isAuthenticated, router]);

  if (isAuthLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#F5F5F7]">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#F26522]/30 border-t-[#F26522]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (withTabs) {
    return (
      <div className="flex h-dvh flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
        <BottomTabBar />
      </div>
    );
  }

  return <>{children}</>;
}
