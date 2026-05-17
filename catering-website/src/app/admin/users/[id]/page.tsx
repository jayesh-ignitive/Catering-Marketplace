"use client";

import { AdminUserDetailView } from "@/components/admin/AdminUserDetail";
import { useParams } from "next/navigation";

export default function AdminUserDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  return <AdminUserDetailView userId={id} />;
}
