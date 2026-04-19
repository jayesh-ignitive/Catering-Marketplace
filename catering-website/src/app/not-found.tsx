import { SiteFooter } from "@/components/common/SiteFooter";
import { SiteHeader } from "@/components/common/SiteHeader";
import { SiteNotFoundBody } from "@/components/common/SiteNotFoundBody";

/**
 * Root not-found: required for unknown URLs (e.g. /this-does-not-exist).
 * `app/(public)/not-found.tsx` only applies inside that segment; Next uses this file for global 404s.
 */
export default function GlobalNotFound() {
  return (
    <>
      <SiteHeader />
      <div className="flex min-h-0 flex-1 flex-col">
        <SiteNotFoundBody />
      </div>
      <SiteFooter />
    </>
  );
}
