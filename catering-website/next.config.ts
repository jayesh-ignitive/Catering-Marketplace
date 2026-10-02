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

  /** Common R2 custom domains (legacy + Bharat Cater Hub). */
  for (const host of [
    "cdn.bharatcaterhub.com",
    "cdn.caterersspace.com",
  ]) {
    pushHost(patterns, host);
  }

  return patterns;
}

/** Origin (scheme + host + port) of the catering API, for CSP `connect-src`. */
function apiConnectSrc(): string {
  const raw = process.env.NEXT_PUBLIC_CATERING_API_URL?.trim() || "http://localhost:4000";
  try {
    return new URL(raw).origin;
  } catch {
    return "";
  }
}

/** Enforcing Content-Security-Policy. See next.config notes / plan for rationale. */
function contentSecurityPolicy(): string {
  // React's dev runtime uses eval() for source maps / call stacks. Production builds do not.
  const scriptSrc = [
    "script-src 'self' 'unsafe-inline' https://maps.googleapis.com",
    process.env.NODE_ENV !== "production" ? "'unsafe-eval'" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "upgrade-insecure-requests",
    // 'unsafe-inline' required by Next inlineCss, Google Maps, react-toastify, Leaflet.
    scriptSrc,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    [
      "img-src 'self' data: blob:",
      "https://cdn.caterersspace.com",
      "https://cdn.bharatcaterhub.com",
      "https://images.unsplash.com",
      "https://ui-avatars.com",
      "https://maps.gstatic.com",
      "https://*.googleapis.com",
      "https://*.google.com",
      "https://*.tile.openstreetmap.org",
    ].join(" "),
    [
      "connect-src 'self'",
      "https://maps.googleapis.com",
      // PlaceAutocompleteElement calls Places API (New) on this host, not maps.googleapis.com.
      "https://places.googleapis.com",
      apiConnectSrc(),
    ]
      .filter(Boolean)
      .join(" "),
    "worker-src 'self' blob:",
    "frame-src 'self' https://*.google.com",
  ];
  return directives.join("; ");
}

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy() },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self)",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
] as const;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    /**
     * Turn barrel imports into per-icon/per-module imports so pages only ship the
     * components they use. `recharts` and `react-icons/*` are optimized by Next by
     * default; `@phosphor-icons/react` (used across every public page) and
     * `react-select` are not, so we add them here to cut client JS / TBT.
     */
    optimizePackageImports: ["@phosphor-icons/react", "react-select"],
    /**
     * Inline Tailwind's (small, atomic) CSS into the document <head> instead of a
     * render-blocking <link>, improving FCP/LCP for first-time visitors.
     */
    inlineCss: true,
  },
  images: {
    remotePatterns: cateringApiImagePatterns(),
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    deviceSizes: [640, 750, 828, 1080, 1200, 1400, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS.map((h) => ({ ...h })),
      },
    ];
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
