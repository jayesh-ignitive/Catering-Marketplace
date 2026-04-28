import type { Metadata } from "next";
import { routeSeo } from "@/lib/seo";

export const metadata: Metadata = routeSeo.register;

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
