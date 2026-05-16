import type { Metadata } from "next";
import { privateAreaRobots } from "@/lib/seo";
import { AdminWorkspaceShell } from "./AdminWorkspaceShell";

export const metadata: Metadata = {
  title: { default: "Admin Dashboard", template: "%s · Admin" },
  description: "Platform admin dashboard and analytics.",
  robots: privateAreaRobots,
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminWorkspaceShell>{children}</AdminWorkspaceShell>;
}
