import type { Metadata } from "next";
import { routeSeo } from "@/lib/seo";

export const metadata: Metadata = routeSeo.login;

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
