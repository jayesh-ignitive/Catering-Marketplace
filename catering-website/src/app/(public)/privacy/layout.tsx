import type { Metadata } from "next";
import { publicSiteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: `Privacy Policy | ${publicSiteConfig.siteName}`,
  description: `How ${publicSiteConfig.siteName} collects, uses, and protects your personal information.`,
  alternates: { canonical: `${publicSiteConfig.siteUrl}/privacy` },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
