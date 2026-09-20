import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";

import { Providers } from "@/components/providers";

import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Travel Marble",
  description: "주사위로 떠나는 강원도 여행",
  applicationName: "Travel Marble",
  appleWebApp: {
    capable: true,
    title: "Travel Marble",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/images/favicon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#F26522",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${outfit.variable} antialiased`}>
        <Providers>
          <div className="mobile-shell">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
