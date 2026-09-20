"use client";

import { AuthProvider } from "@/contexts/auth-context";
import { AppAlertProvider } from "@/components/ui/app-alert";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <AppAlertProvider />
    </AuthProvider>
  );
}
