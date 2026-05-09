import { CaretRight } from "@phosphor-icons/react";
import Link from "next/link";

export type AdminBreadcrumbItem = {
  label: string;
  href?: string;
};

export function AdminBreadcrumb({ items }: { items: AdminBreadcrumbItem[] }) {
  return (
    <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs font-medium" aria-label="Breadcrumb">
      {items.map((item, i) => (
        <span key={`${item.label}-${i}`} className="inline-flex items-center gap-2">
          {i > 0 ? (
            <CaretRight className="size-2.5 shrink-0 text-brand-text-muted" weight="bold" aria-hidden />
          ) : null}
          {item.href ? (
            <Link href={item.href} className="text-brand-text-muted transition-colors hover:text-brand-red">
              {item.label}
            </Link>
          ) : (
            <span className="text-brand-text-dark">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
