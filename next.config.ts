import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
});

const nextConfig: NextConfig = {
  // Production ready optimizations
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.googleusercontent.com" },
      { protocol: "https", hostname: "*.githubusercontent.com" },
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "*.whatsapp.net" }, // mmg.whatsapp.net
      { protocol: "https", hostname: "*.fbsbx.com" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.cloudinary.com" },
      { protocol: "https", hostname: "oaidalleapiprodscus.blob.core.windows.net" }
    ]
  }
};

export default withSerwist(nextConfig);
