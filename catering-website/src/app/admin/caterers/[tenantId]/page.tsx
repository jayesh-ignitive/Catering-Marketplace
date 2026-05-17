"use client";

import { AdminCatererReviewDetailView } from "@/components/admin/AdminCatererReviewDetail";
import { useParams } from "next/navigation";

export default function AdminCatererReviewPage() {
  const params = useParams();
  const tenantId = typeof params.tenantId === "string" ? params.tenantId : "";

  return <AdminCatererReviewDetailView tenantId={tenantId} />;
}
