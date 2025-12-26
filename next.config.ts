const nextConfig: any = {
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
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
