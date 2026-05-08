"use client";

import dynamic from "next/dynamic";

/** Client-only dynamic import — Recharts + dashboard chunk loads when `/admin` is visited. */
const AdminDashboardContent = dynamic(() => import("./AdminDashboardContent"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-stone-500">
      <div
        className="h-10 w-10 animate-spin rounded-full border-4 border-stone-200 border-t-brand-red"
        aria-hidden
      />
      <p className="text-sm font-semibold">Loading dashboard…</p>
    </div>
  ),
});

export default function AdminDashboardLazy() {
  return <AdminDashboardContent />;
}
