"use client";

import { useAuth } from "@/context/AuthContext";
import type { AdminDashboardOverview } from "@/lib/admin-api";
import { fetchAdminDashboardOverview } from "@/lib/admin-api";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function StatCard({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <article className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-stone-500">{label}</p>
      <p className="mt-3 text-3xl font-extrabold tracking-tight text-stone-900">{value}</p>
      {hint ? <p className="mt-2 text-xs text-stone-500">{hint}</p> : null}
    </article>
  );
}

function chartDateTick(iso: string): string {
  const [, m, d] = iso.split("-");
  if (!m || !d) return iso;
  return `${m}/${d}`;
}

const chartTooltipProps = {
  contentStyle: {
    borderRadius: "12px",
    border: "1px solid rgb(231 229 228)",
    boxShadow: "0 4px 14px rgb(0 0 0 / 0.06)",
  },
};

function RoleMixChart({
  data,
  valueLabel = "Count",
  emptyHint = "No data yet",
}: {
  data: { name: string; value: number; fill: string }[];
  valueLabel?: string;
  emptyHint?: string;
}) {
  const filtered = data.filter((x) => x.value > 0);
  if (filtered.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-stone-400">{emptyHint}</div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={filtered}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={56}
          outerRadius={88}
          paddingAngle={2}
        >
          {filtered.map((entry) => (
            <Cell key={entry.name} fill={entry.fill} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip {...chartTooltipProps} formatter={(v) => [Number(v ?? 0), valueLabel]} />
        <Legend verticalAlign="bottom" height={36} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function ActivityCharts({ d }: { d: AdminDashboardOverview }) {
  const rows = d.timeline.rows;

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-stone-900">New registrations</h2>
        <p className="mt-1 text-xs text-stone-500">
          User sign-ups per day · last {d.timeline.days} days
        </p>
        <div className="mt-4 h-[280px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rows} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="adminSignupsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(229 57 53)" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="rgb(229 57 53)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(231 229 228)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#78716c" }}
                tickFormatter={chartDateTick}
                tickMargin={8}
              />
              <YAxis tick={{ fontSize: 11, fill: "#78716c" }} width={36} allowDecimals={false} />
              <Tooltip
                {...chartTooltipProps}
                labelFormatter={(label) => `Date · ${label}`}
                formatter={(value) => [Number(value ?? 0), "Sign-ups"]}
              />
              <Area
                type="monotone"
                dataKey="signups"
                name="Sign-ups"
                stroke="rgb(229 57 53)"
                strokeWidth={2}
                fill="url(#adminSignupsFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-stone-900">Inquiries & reviews</h2>
        <p className="mt-1 text-xs text-stone-500">
          Contact form messages vs new reviews · last {d.timeline.days} days
        </p>
        <div className="mt-4 h-[280px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(231 229 228)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#78716c" }}
                tickFormatter={chartDateTick}
                tickMargin={8}
              />
              <YAxis tick={{ fontSize: 11, fill: "#78716c" }} width={36} allowDecimals={false} />
              <Tooltip {...chartTooltipProps} labelFormatter={(label) => `Date · ${label}`} />
              <Legend wrapperStyle={{ paddingTop: 12 }} />
              <Bar
                dataKey="inquiries"
                name="Inquiries"
                fill="rgb(14 165 233)"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
              <Bar
                dataKey="reviews"
                name="Reviews"
                fill="rgb(34 197 94)"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardContent() {
  const { token, user } = useAuth();
  const overviewQ = useQuery({
    queryKey: ["admin", "dashboard", "overview", token],
    queryFn: () => fetchAdminDashboardOverview(token!),
    enabled: Boolean(token && user?.role === "admin"),
    retry: 1,
  });

  if (overviewQ.isPending) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-stone-500">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-stone-200 border-t-brand-red" />
        <p className="text-sm font-semibold">Loading dashboard…</p>
      </div>
    );
  }

  if (overviewQ.isError || !overviewQ.data) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
        <h1 className="text-lg font-bold">Could not load admin dashboard</h1>
        <p className="mt-2 text-sm">
          Please refresh and try again. If this keeps happening, verify that your account has admin
          access and the backend is running.
        </p>
      </div>
    );
  }

  const d = overviewQ.data;

  const rolePie = [
    { name: "Caterers", value: d.totals.caterers, fill: "rgb(229 57 53)" },
    { name: "Admins", value: d.totals.admins, fill: "rgb(87 83 78)" },
  ];

  const listingPie = [
    { name: "Published", value: d.totals.listedCaterers, fill: "rgb(34 197 94)" },
    { name: "Draft profiles", value: d.totals.draftsListed, fill: "rgb(251 191 36)" },
  ];

  return (
    <section className="mx-auto max-w-7xl">
      <p className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)]">
        Admin
      </p>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
        Dashboard
      </h1>
      <p className="mt-2 text-sm text-stone-500">
        Last updated: {new Date(d.generatedAt).toLocaleString()}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total users" value={d.totals.users} hint={`+${d.recent.usersLast7Days} in last 7 days`} />
        <StatCard label="Total inquiries" value={d.totals.inquiries} hint={`+${d.recent.inquiriesLast7Days} in last 7 days`} />
        <StatCard label="Published caterers" value={d.totals.listedCaterers} />
        <StatCard label="Draft listings" value={d.totals.draftsListed} />
        <StatCard label="Total reviews" value={d.totals.reviews} hint={`+${d.recent.reviewsLast7Days} in last 7 days`} />
        <StatCard label="Total caterers" value={d.totals.caterers} />
        <StatCard label="Platform admins" value={d.totals.admins} />
      </div>

      <ActivityCharts d={d} />

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-stone-900">Accounts by role</h2>
          <p className="mt-1 text-xs text-stone-500">Caterer vs admin users</p>
          <RoleMixChart data={rolePie} valueLabel="Accounts" emptyHint="No accounts yet" />
        </div>
        <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-stone-900">Listing pipeline</h2>
          <p className="mt-1 text-xs text-stone-500">Published marketplace profiles vs drafts</p>
          <RoleMixChart data={listingPie} valueLabel="Listings" emptyHint="No listings yet" />
        </div>
      </div>
    </section>
  );
}
