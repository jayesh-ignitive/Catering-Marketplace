import type { Metadata } from "next";
import { publicSiteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: `Terms & Conditions | ${publicSiteConfig.siteName}`,
  description: `Terms and conditions for using ${publicSiteConfig.siteName} and our catering marketplace.`,
  alternates: { canonical: `${publicSiteConfig.siteUrl}/terms` },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
