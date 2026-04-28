import type { Metadata } from "next";
import { routeSeo } from "@/lib/seo";

export const metadata: Metadata = routeSeo.verifyEmail;

export default function VerifyEmailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
