import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com",
        pathname: "/api/**",
      },
    ],
  },
  async redirects() {
    return [
      { source: "/workspace/business", destination: "/workspace/onboarding", permanent: true },
      {
        source: "/workspace/business/onboarding",
        destination: "/workspace/onboarding",
        permanent: true,
      },
      { source: "/account", destination: "/workspace", permanent: false },
      /** Legacy bookmark: old admin UI lived under /admin/login; platform admin app is now /admin (see app/admin). */
      { source: "/admin/login", destination: "/login", permanent: false },
    ];
  },
};

export default nextConfig;
