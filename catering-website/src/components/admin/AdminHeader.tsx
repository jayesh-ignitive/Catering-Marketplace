"use client";

import type { AuthUser } from "@/lib/auth-api";
import { List, SignOut, UserCircle } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function adminSectionTitle(pathname: string): string {
  if (pathname.startsWith("/admin/users/") && pathname !== "/admin/users") {
    return "User details";
  }
  if (pathname.startsWith("/admin/menu-categories")) {
    return "Menu categories";
  }
  if (pathname.startsWith("/admin/menu-items")) {
    return "Menu items";
  }
  if (pathname.startsWith("/admin/ingredient-categories")) {
    return "Ingredient categories";
  }
  if (pathname.startsWith("/admin/ingredients")) {
    return "Ingredients";
  }
  if (pathname.startsWith("/admin/attributes")) {
    return "Attributes";
  }
  if (pathname.startsWith("/admin/languages")) {
    return "Languages";
  }
  if (pathname.startsWith("/admin/caterers")) {
    return pathname.includes("/admin/caterers/") && pathname !== "/admin/caterers"
      ? "Caterer review"
      : "Caterers";
  }
  if (pathname.startsWith("/admin/users")) {
    return "Users";
  }
  if (pathname.startsWith("/admin/service-categories")) {
    return "Service categories";
  }
  if (pathname.startsWith("/admin/home-banners")) {
    return "Home banners";
  }
  if (pathname.startsWith("/admin/blog-posts")) {
    return "Blog posts";
  }
  if (pathname.startsWith("/admin/contact-inquiries")) {
    return pathname.includes("/admin/contact-inquiries/") &&
      pathname !== "/admin/contact-inquiries"
      ? "Inquiry details"
      : "Contact inquiries";
  }
  if (pathname === "/admin") {
    return "Dashboard";
  }
  return "Admin";
}

function adminSectionSubtitle(pathname: string): string {
  if (pathname.startsWith("/admin/users/") && pathname !== "/admin/users") {
    return "Inspect account, tenant links, and marketplace profile.";
  }
  if (pathname.startsWith("/admin/menu-categories")) {
    return "Manage catalog hierarchy, English source labels, and translations.";
  }
  if (pathname.startsWith("/admin/menu-items")) {
    return "Dishes and packages with recipes, attributes, and translations.";
  }
  if (pathname.startsWith("/admin/ingredient-categories")) {
    return "Manage ingredient taxonomy, English names, and translations.";
  }
  if (pathname.startsWith("/admin/ingredients")) {
    return "Stock items with codes, units, categories, and translations.";
  }
  if (pathname.startsWith("/admin/attributes")) {
    return "Cuisine, dietary, service, and spice labels with multilingual names.";
  }
  if (pathname.startsWith("/admin/languages")) {
    return "Configure locales available across the platform.";
  }
  if (pathname.startsWith("/admin/caterers/") && pathname !== "/admin/caterers") {
    return "Review listing details and approve or reject marketplace visibility.";
  }
  if (pathname.startsWith("/admin/caterers")) {
    return "Browse workspaces, provisioning state, and publishing.";
  }
  if (pathname.startsWith("/admin/users")) {
    return "Search accounts, roles, verification, and workspace links.";
  }
  if (pathname.startsWith("/admin/service-categories")) {
    return "Specialties and filters shown on caterer listings.";
  }
  if (pathname.startsWith("/admin/home-banners")) {
    return "Hero images and copy on the public homepage.";
  }
  if (pathname.startsWith("/admin/blog-posts")) {
    return "Articles, SEO fields, and publishing for the blog.";
  }
  if (
    pathname.startsWith("/admin/contact-inquiries/") &&
    pathname !== "/admin/contact-inquiries"
  ) {
    return "Read the full message and reply to the sender.";
  }
  if (pathname.startsWith("/admin/contact-inquiries")) {
    return "Messages submitted through the public contact form.";
  }
  if (pathname === "/admin") {
    return "Platform overview, traffic signals, and listing health.";
  }
  return "Platform administration";
}

type AdminHeaderProps = {
  user: AuthUser;
  onToggleSidebar: () => void;
  onLogout: () => void;
};

export function AdminHeader({ user, onToggleSidebar, onLogout }: AdminHeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    user.fullName,
  )}&background=e53935&color=ffffff&bold=true`;

  useEffect(() => {
    if (!menuOpen) return;
    function onDocMouseDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const title = adminSectionTitle(pathname);
  const subtitle = adminSectionSubtitle(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-20 shrink-0 items-center justify-between border-b border-gray-100 bg-white/80 px-4 backdrop-blur-md md:px-8">
      <div className="flex min-w-0 items-center gap-4">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-xl text-brand-text-muted transition-colors hover:bg-brand-red/10 hover:text-brand-red focus-visible:outline focus-visible:ring-2 focus-visible:ring-brand-red/30 focus-visible:ring-offset-2"
          aria-label="Toggle admin navigation"
        >
          <List size={26} weight="regular" aria-hidden />
        </button>
        <div className="hidden min-w-0 md:block">
          <h1 className="font-heading text-xl font-bold tracking-tight text-brand-text-dark">{title}</h1>
          <p className="text-xs text-brand-text-muted">{subtitle}</p>
        </div>
      </div>

      <div className="relative flex items-center gap-4" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className={`group relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white p-0.5 shadow-sm transition-all duration-300 hover:scale-110 hover:border-brand-red hover:shadow-md focus-visible:outline focus-visible:ring-2 focus-visible:ring-brand-red/35 focus-visible:ring-offset-2 ${
            menuOpen ? "border-brand-red ring-2 ring-brand-red/25" : ""
          }`}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          aria-label="Account menu"
          title="Account menu"
        >
          <div className="relative h-full w-full overflow-hidden rounded-full">
            <Image
              src={avatarUrl}
              alt=""
              fill
              sizes="40px"
              className="pointer-events-none object-cover"
              unoptimized
            />
            <span className="sr-only">{user.fullName}</span>
          </div>
        </button>

        {menuOpen ? (
          <div
            role="menu"
            className="absolute right-0 top-full z-[60] mt-3 w-56 rounded-2xl border border-gray-100 bg-white py-1 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.12)]"
          >
            <div className="border-b border-gray-50 px-4 py-3">
              <p className="truncate text-sm font-bold text-brand-text-dark">{user.fullName}</p>
              <p className="truncate text-xs text-brand-text-muted">{user.email}</p>
              <span className="mt-2 inline-block rounded-full bg-brand-red-light px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-brand-red">
                Administrator
              </span>
            </div>
            <Link
              href="/admin"
              role="menuitem"
              className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold text-brand-text-dark transition hover:bg-brand-page"
              onClick={() => setMenuOpen(false)}
            >
              <UserCircle size={18} weight="bold" className="text-brand-text-muted" aria-hidden />
              Dashboard
            </Link>
            <button
              type="button"
              role="menuitem"
              className="flex w-full cursor-pointer items-center gap-3 border-t border-gray-50 px-4 py-2.5 text-left text-sm font-semibold text-brand-text-dark transition hover:bg-brand-page"
              onClick={() => {
                setMenuOpen(false);
                onLogout();
              }}
            >
              <SignOut size={18} weight="bold" className="text-brand-text-muted" aria-hidden />
              Sign out
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
