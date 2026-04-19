import { SiteNotFoundBody } from "@/components/common/SiteNotFoundBody";

/** Renders when `notFound()` is called from a route under `(public)` — layout already adds header/footer. */
export default function PublicSegmentNotFound() {
  return <SiteNotFoundBody />;
}
