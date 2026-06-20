"use client";

import {
  CalendarBlank,
  ChartLineUp,
  ForkKnife,
  MagnifyingGlass,
  MapPin,
  Plus,
  TrendDown,
  TrendUp,
  Users,
} from "@phosphor-icons/react";
import {
  fieldRadius,
  workspaceCardTitleClass,
  workspaceHintTextClass,
} from "./caterer-profile/constants";

type PreviewKind = "menu" | "orders" | "analytics";

const FOOD_GRADIENTS = [
  "from-amber-200 via-orange-300 to-rose-300",
  "from-yellow-100 via-amber-200 to-orange-200",
  "from-lime-100 via-emerald-200 to-teal-200",
  "from-rose-100 via-pink-200 to-fuchsia-200",
  "from-orange-100 via-red-200 to-rose-300",
  "from-sky-100 via-cyan-200 to-blue-200",
] as const;

function PreviewPageHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-text-muted">{eyebrow}</p>
        <h1 className="font-heading mt-1 text-2xl font-bold tracking-tight text-brand-text-dark md:text-3xl">
          {title}
        </h1>
      </div>
      {action}
    </div>
  );
}

function MockButton({ children, primary }: { children: React.ReactNode; primary?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold ${
        primary
          ? "bg-brand-red text-white shadow-md shadow-brand-red/20"
          : "border border-gray-200 bg-white text-brand-text-dark"
      }`}
    >
      {children}
    </span>
  );
}

function MenuPreview() {
  const categories = ["Starters", "Main course", "Desserts", "Beverages", "Packages"];
  const dishes = [
    { name: "Paneer Tikka", price: "₹180", tag: "Veg", guests: "Min 50" },
    { name: "Hyderabadi Biryani", price: "₹320", tag: "Non-veg", guests: "Per plate" },
    { name: "Dal Makhani", price: "₹140", tag: "Veg", guests: "Per plate" },
    { name: "Gulab Jamun", price: "₹90", tag: "Veg", guests: "Per dozen" },
    { name: "Live Chaat Counter", price: "₹12,000", tag: "Package", guests: "Up to 200" },
    { name: "Wedding Thali", price: "₹650", tag: "Package", guests: "Per guest" },
  ];

  return (
    <div className="w-full min-w-0 max-w-5xl space-y-6 pb-8">
      <PreviewPageHeader
        eyebrow="Workspace"
        title="Menu management"
        action={
          <MockButton primary>
            <Plus size={16} weight="bold" aria-hidden />
            Add dish
          </MockButton>
        }
      />

      <div className="admin-panel-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-3 rounded-xl border border-gray-100 bg-brand-page/80 px-4 py-3">
            <MagnifyingGlass className="shrink-0 text-brand-text-muted" size={18} aria-hidden />
            <span className="text-sm text-brand-text-muted">Search dishes, packages…</span>
          </div>
          <div className="flex gap-2">
            <MockButton>Import</MockButton>
            <MockButton>Categories</MockButton>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {categories.map((label, i) => (
            <span
              key={label}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                i === 0
                  ? "bg-brand-red text-white shadow-sm"
                  : "bg-brand-page text-brand-text-muted ring-1 ring-gray-100"
              }`}
            >
              {label}
            </span>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {dishes.map((dish, i) => (
            <article
              key={dish.name}
              className={`overflow-hidden ${fieldRadius} border border-gray-100 bg-white shadow-sm`}
            >
              <div
                className={`relative h-32 bg-gradient-to-br ${FOOD_GRADIENTS[i % FOOD_GRADIENTS.length]}`}
              >
                <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-text-dark">
                  {dish.tag}
                </span>
                <span className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-brand-red shadow-sm">
                  <ForkKnife size={16} weight="duotone" aria-hidden />
                </span>
              </div>
              <div className="p-4">
                <p className="text-sm font-bold text-brand-text-dark">{dish.name}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-base font-bold text-brand-red">{dish.price}</span>
                  <span className="text-xs font-medium text-brand-text-muted">{dish.guests}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function OrdersPreview() {
  const stats = [
    { label: "New enquiries", value: "12", tone: "bg-sky-50 text-sky-700 ring-sky-100" },
    { label: "Quotes sent", value: "8", tone: "bg-amber-50 text-amber-800 ring-amber-100" },
    { label: "Confirmed", value: "5", tone: "bg-emerald-50 text-emerald-700 ring-emerald-100" },
  ];

  const orders = [
    { id: "#1042", name: "Sharma Wedding", event: "Wedding · 350 guests", status: "New", statusTone: "bg-sky-100 text-sky-800", date: "24 Jun" },
    { id: "#1041", name: "TechCorp Annual Day", event: "Corporate · 120 guests", status: "Quoted", statusTone: "bg-amber-100 text-amber-900", date: "22 Jun" },
    { id: "#1039", name: "Patel Housewarming", event: "Housewarming · 80 guests", status: "Confirmed", statusTone: "bg-emerald-100 text-emerald-800", date: "18 Jun" },
    { id: "#1038", name: "Birthday — Meera K.", event: "Birthday · 45 guests", status: "New", statusTone: "bg-sky-100 text-sky-800", date: "17 Jun" },
    { id: "#1035", name: "Engagement — Roy Family", event: "Engagement · 200 guests", status: "Quoted", statusTone: "bg-amber-100 text-amber-900", date: "15 Jun" },
  ];

  return (
    <div className="w-full min-w-0 max-w-5xl space-y-6 pb-8">
      <PreviewPageHeader eyebrow="Workspace" title="Orders" />

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="admin-panel-card p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-text-muted">{stat.label}</p>
            <p className="font-heading mt-2 text-3xl font-bold text-brand-text-dark">{stat.value}</p>
            <span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ${stat.tone}`}>
              This month
            </span>
          </div>
        ))}
      </div>

      <div className="admin-datatable-shell">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f1f1f1] px-6 py-4">
          <p className={workspaceCardTitleClass}>Recent enquiries</p>
          <div className="flex gap-2">
            {["All", "New", "Quoted", "Confirmed"].map((f, i) => (
              <span
                key={f}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                  i === 0 ? "bg-brand-red text-white" : "bg-brand-page text-brand-text-muted"
                }`}
              >
                {f}
              </span>
            ))}
          </div>
        </div>
        <div className="hidden border-b border-[#f1f1f1] bg-white px-6 py-3 sm:grid sm:grid-cols-[1fr_auto_auto] sm:gap-4">
          <span className="text-[0.7rem] font-bold uppercase tracking-wider text-brand-text-muted">Enquiry</span>
          <span className="text-[0.7rem] font-bold uppercase tracking-wider text-brand-text-muted">Status</span>
          <span className="text-[0.7rem] font-bold uppercase tracking-wider text-brand-text-muted">Date</span>
        </div>
        {orders.map((order) => (
          <div
            key={order.id}
            className="grid gap-3 border-b border-[#f1f1f1] px-6 py-5 last:border-b-0 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-4"
          >
            <div className="min-w-0">
              <p className="text-sm font-bold text-brand-text-dark">
                {order.name}{" "}
                <span className="font-medium text-brand-text-muted">{order.id}</span>
              </p>
              <p className={`mt-1 flex items-center gap-1.5 ${workspaceHintTextClass}`}>
                <Users size={14} aria-hidden />
                {order.event}
              </p>
            </div>
            <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${order.statusTone}`}>
              {order.status}
            </span>
            <span className="flex items-center gap-1.5 text-sm font-semibold text-brand-text-muted">
              <CalendarBlank size={14} aria-hidden />
              {order.date}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniLineChart() {
  return (
    <svg viewBox="0 0 320 120" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="ws-premium-chart-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(229 57 53 / 0.25)" />
          <stop offset="100%" stopColor="rgb(229 57 53 / 0)" />
        </linearGradient>
      </defs>
      <path
        d="M0 90 L40 72 L80 78 L120 55 L160 62 L200 38 L240 44 L280 22 L320 30 L320 120 L0 120 Z"
        fill="url(#ws-premium-chart-fill)"
      />
      <path
        d="M0 90 L40 72 L80 78 L120 55 L160 62 L200 38 L240 44 L280 22 L320 30"
        fill="none"
        stroke="#e53935"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AnalyticsPreview() {
  const kpis = [
    { label: "Profile views", value: "2,840", change: "+18%", up: true },
    { label: "Leads", value: "46", change: "+12%", up: true },
    { label: "Enquiries", value: "31", change: "-4%", up: false },
    { label: "Conversion", value: "8.2%", change: "+2.1%", up: true },
  ];

  const sources = [
    { label: "Marketplace search", pct: 62 },
    { label: "Direct profile link", pct: 24 },
    { label: "Category browse", pct: 14 },
  ];

  return (
    <div className="w-full min-w-0 max-w-5xl space-y-6 pb-8">
      <PreviewPageHeader
        eyebrow="Workspace"
        title="Analytics"
        action={
          <div className="flex gap-2">
            {["7 days", "30 days", "90 days"].map((p, i) => (
              <span
                key={p}
                className={`rounded-xl px-3 py-2 text-xs font-bold ${
                  i === 1 ? "bg-brand-red text-white" : "bg-white text-brand-text-muted ring-1 ring-gray-100"
                }`}
              >
                {p}
              </span>
            ))}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="admin-panel-card p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-text-muted">{kpi.label}</p>
            <p className="font-heading mt-2 text-2xl font-bold text-brand-text-dark">{kpi.value}</p>
            <span
              className={`mt-3 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold ${
                kpi.up ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
              }`}
            >
              {kpi.up ? <TrendUp size={12} weight="bold" aria-hidden /> : <TrendDown size={12} weight="bold" aria-hidden />}
              {kpi.change}
            </span>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="admin-panel-card p-6 lg:col-span-3">
          <div className="flex items-center justify-between gap-3">
            <p className={workspaceCardTitleClass}>Listing performance</p>
            <ChartLineUp className="text-brand-red" size={22} weight="duotone" aria-hidden />
          </div>
          <div className="mt-4 h-44 rounded-2xl bg-gradient-to-b from-brand-red-light/40 to-white p-3 ring-1 ring-gray-100">
            <MiniLineChart />
          </div>
        </div>
        <div className="admin-panel-card p-6 lg:col-span-2">
          <p className={workspaceCardTitleClass}>Top traffic sources</p>
          <ul className="mt-5 space-y-4">
            {sources.map((src) => (
              <li key={src.label}>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-semibold text-brand-text-dark">{src.label}</span>
                  <span className="font-bold text-brand-red">{src.pct}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-brand-page">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-red to-orange-400"
                    style={{ width: `${src.pct}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
          <p className={`mt-5 flex items-center gap-1.5 ${workspaceHintTextClass}`}>
            <MapPin size={14} aria-hidden />
            Most views from Ahmedabad &amp; Gandhinagar
          </p>
        </div>
      </div>
    </div>
  );
}

const previews: Record<PreviewKind, () => React.ReactElement> = {
  menu: MenuPreview,
  orders: OrdersPreview,
  analytics: AnalyticsPreview,
};

export function WorkspacePremiumModulePreview({ kind }: { kind: PreviewKind }) {
  const Preview = previews[kind];
  return <Preview />;
}

export type { PreviewKind };
