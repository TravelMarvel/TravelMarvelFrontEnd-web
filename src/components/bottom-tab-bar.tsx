"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/marvel", label: "마블", icon: "🎲" },
  { href: "/album", label: "내앨범", icon: "📷" },
  { href: "/mypage", label: "마이페이지", icon: "👤" },
] as const;

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="safe-bottom z-40 shrink-0 border-t border-[#E8E8EC] bg-white/95 backdrop-blur-md">
      <ul className="grid h-16 grid-cols-3">
        {TABS.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={`flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${
                  active ? "text-[#F26522]" : "text-[#9E9E9E]"
                }`}
              >
                <span className="text-[20px] leading-none">{tab.icon}</span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
