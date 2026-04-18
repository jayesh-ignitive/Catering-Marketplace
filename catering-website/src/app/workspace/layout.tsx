import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Workspace", template: "%s · My business" },
  description: "Manage your catering business profile, gallery, and listings.",
  robots: { index: false, follow: false },
};

export default function WorkspaceRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased">
      {children}
    </div>
  );
}
