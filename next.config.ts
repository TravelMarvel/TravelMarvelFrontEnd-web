import type { NextConfig } from "next";
import path from "path";

const API_ORIGIN =
  process.env.TRAVEL_MARBLE_API_ORIGIN ?? "https://api.travelmarble.site/api";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: `${API_ORIGIN}/:path*`,
      },
    ];
  },
};

export default nextConfig;
