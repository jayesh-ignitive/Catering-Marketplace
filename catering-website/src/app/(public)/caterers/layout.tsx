import type { Metadata } from "next";
import { routeSeo } from "@/lib/seo";

export const metadata: Metadata = routeSeo.caterers;

export default function CaterersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
