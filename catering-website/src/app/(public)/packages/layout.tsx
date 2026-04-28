import type { Metadata } from "next";
import { routeSeo } from "@/lib/seo";

export const metadata: Metadata = routeSeo.packages;

export default function PackagesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
