import type { Metadata } from "next";
import { routeSeo } from "@/lib/seo";
import { greatVibes } from "@/app/fonts";

export const metadata: Metadata = routeSeo.workspace;

export default function WorkspaceRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${greatVibes.variable} min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased`}>
      {children}
    </div>
  );
}
