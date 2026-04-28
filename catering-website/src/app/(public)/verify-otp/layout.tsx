import type { Metadata } from "next";
import { routeSeo } from "@/lib/seo";

export const metadata: Metadata = routeSeo.verifyOtp;

export default function VerifyOtpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
