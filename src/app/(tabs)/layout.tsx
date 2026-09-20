import { AuthGuard } from "@/components/auth-guard";

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard withTabs>{children}</AuthGuard>;
}
