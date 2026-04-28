import type { Metadata } from "next";
import { routeSeo } from "@/lib/seo";

export const metadata: Metadata = routeSeo.blog;

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
