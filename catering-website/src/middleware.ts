import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PRIVATE_PREFIXES = ["/admin", "/workspace"] as const;

function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/** Belt-and-suspenders: tell crawlers not to index authenticated app areas. */
export function middleware(request: NextRequest) {
  if (!isPrivatePath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/workspace/:path*"],
};
