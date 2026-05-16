import type { NextConfig } from "next";

type RemotePattern = NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]>[number];

function pushPattern(patterns: RemotePattern[], pattern: RemotePattern) {
  const dupe = patterns.some(
    (p) =>
      p.protocol === pattern.protocol &&
      p.hostname === pattern.hostname &&
      (p.port ?? "") === (pattern.port ?? "") &&
      p.pathname === pattern.pathname
  );
  if (!dupe) patterns.push(pattern);
}

function pushHost(
  patterns: RemotePattern[],
  hostname: string,
  opts?: { protocol?: "http" | "https"; port?: string; pathname?: string }
) {
  const host = hostname.trim().toLowerCase();
  if (!host) return;
  pushPattern(patterns, {
    protocol: opts?.protocol ?? "https",
    hostname: host,
    ...(opts?.port ? { port: opts.port } : {}),
    pathname: opts?.pathname ?? "/**",
  });
}

function pushUrlAsPattern(patterns: RemotePattern[], urlStr: string, pathname = "/**") {
  try {
    const u = new URL(urlStr);
    const protocol = u.protocol.replace(":", "") as "http" | "https";
    if (protocol !== "http" && protocol !== "https") return;
    pushPattern(patterns, {
      protocol,
      hostname: u.hostname,
      ...(u.port ? { port: u.port } : {}),
      pathname,
    });
  } catch {
    /* ignore invalid URL */
  }
}

function cateringApiImagePatterns(): RemotePattern[] {
  const patterns: RemotePattern[] = [
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
  ];

  pushUrlAsPattern(patterns, process.env.NEXT_PUBLIC_CATERING_API_URL?.trim() || "http://localhost:4000", "/uploads/**");

  const cdnBase = process.env.NEXT_PUBLIC_IMAGE_CDN_BASE_URL?.trim();
  if (cdnBase) {
    pushUrlAsPattern(patterns, cdnBase, "/**");
  }

  const cdnHosts = process.env.NEXT_PUBLIC_IMAGE_CDN_HOSTNAME?.trim();
  if (cdnHosts) {
    for (const part of cdnHosts.split(",")) {
      const token = part.trim();
      if (!token) continue;
      if (token.includes("://")) {
        pushUrlAsPattern(patterns, token, "/**");
      } else {
        pushHost(patterns, token);
      }
    }
  }

  /** Common production CDN hosts for this project (R2 custom domains). */
  for (const host of ["cdn.caterersspace.com", "images.caterersspace.com"]) {
    pushHost(patterns, host);
  }

  return patterns;
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: cateringApiImagePatterns(),
    formats: ["image/avif", "image/webp"],
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
