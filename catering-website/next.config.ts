import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/account", destination: "/workspace", permanent: false },
      { source: "/admin", destination: "/", permanent: false },
      { source: "/admin/login", destination: "/login", permanent: false },
      { source: "/admin/dashboard", destination: "/", permanent: false },
      { source: "/admin/dashboard/staff", destination: "/", permanent: false },
      {
        source: "/admin/dashboard/staff/:id/edit",
        destination: "/",
        permanent: false,
      },
      {
        source: "/admin/dashboard/caterers",
        destination: "/",
        permanent: false,
      },
      {
        source: "/admin/dashboard/verification",
        destination: "/",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
