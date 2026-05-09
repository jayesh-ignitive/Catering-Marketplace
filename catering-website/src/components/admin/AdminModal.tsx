"use client";

import { X } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type AdminModalProps = {
  open: boolean;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
  /** `md` ≈ max-w-xl, `lg` ≈ max-w-2xl */
  size?: "md" | "lg";
};

export function AdminModal({
  open,
  title,
  description,
  children,
  footer,
  onClose,
  size = "md",
}: AdminModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || !mounted) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, mounted, onClose]);

  if (!mounted || !open) return null;

  const maxW = size === "lg" ? "max-w-2xl" : "max-w-xl";

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-modal-title"
        className={`flex ${maxW} max-h-[min(92vh,880px)] w-full flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.22)]`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div className="min-w-0 pr-2">
            <h2 id="admin-modal-title" className="font-heading text-lg font-bold tracking-tight text-brand-text-dark">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm leading-snug text-brand-text-muted">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-xl p-2 text-brand-text-muted transition hover:bg-brand-page hover:text-brand-red"
            aria-label="Close dialog"
          >
            <X size={22} weight="bold" aria-hidden />
          </button>
        </header>

        <div className="admin-shell-scroll min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer ? (
          <footer className="shrink-0 border-t border-gray-100 bg-brand-page/50 px-6 py-4">{footer}</footer>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.06em] text-brand-text-muted">{children}</span>
  );
}

export function AdminModalField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="block">
      <FieldLabel>{label}</FieldLabel>
      {children}
    </div>
  );
}
