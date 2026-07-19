import type { Metadata } from "next";
import { privateAreaRobots } from "@/lib/seo";
import { AdminWorkspaceShell } from "./AdminWorkspaceShell";
import { greatVibes } from "@/app/fonts";

export const metadata: Metadata = {
  title: { default: "Admin Dashboard", template: "%s · Admin" },
  description: "Platform admin dashboard and analytics.",
  robots: privateAreaRobots,
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={greatVibes.variable}>
      <AdminWorkspaceShell>{children}</AdminWorkspaceShell>
    </div>
  );
}
