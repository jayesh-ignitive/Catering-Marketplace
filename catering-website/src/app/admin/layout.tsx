import type { Metadata } from "next";
import { AdminWorkspaceShell } from "./AdminWorkspaceShell";

export const metadata: Metadata = {
  title: { default: "Admin Dashboard", template: "%s · Admin" },
  description: "Platform admin dashboard and analytics.",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminWorkspaceShell>{children}</AdminWorkspaceShell>;
}
