"use client";

import { CaretDown, Check, MagnifyingGlass, X } from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAnchoredFixedPanelStyle } from "./useAnchoredFixedPanelStyle";

export type SearchableMultiSelectOption = { id: string; label: string };

type SearchableMultiSelectProps = {
  options: SearchableMultiSelectOption[];
  value: string[];
  onChange: (next: string[]) => void;
  /** Placeholder when nothing selected */
  placeholder?: string;
  /** Placeholder when there are already selections */
  searchPlaceholder?: string;
  emptyMessage?: string;
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  errored?: boolean;
  className?: string;
};

export function SearchableMultiSelect({
  options,
  value,
  onChange,
  placeholder = "Search to select…",
  searchPlaceholder = "Search to add more…",
  emptyMessage = "No matching options.",
  id,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  errored = false,
  className = "",
}: SearchableMultiSelectProps) {
  const listboxId = `${id ?? "search-ms"}-listbox`;
  const rootRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedRows = useMemo(() => {
    const byId = new Map(options.map((o) => [o.id, o]));
    return value.map((vid) => byId.get(vid)).filter(Boolean) as SearchableMultiSelectOption[];
  }, [options, value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const panelStyle = useAnchoredFixedPanelStyle(open, anchorRef, `${query}-${filtered.length}`);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t) || portalRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const toggle = (optionId: string) => {
    if (value.includes(optionId)) {
      onChange(value.filter((x) => x !== optionId));
    } else {
      onChange([...value, optionId]);
    }
  };

  const remove = (optionId: string) => {
    onChange(value.filter((x) => x !== optionId));
  };

  const shellBorder = errored ? "border-brand-red" : "border-[#E5E7EB]";
  const focusBorder = "focus-within:border-brand-red";

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <div
        ref={anchorRef}
        className={`flex min-h-[52px] cursor-text flex-wrap items-center gap-1.5 rounded-sm border bg-white px-3 py-2 transition-colors outline-none ring-0 ring-offset-0 ${shellBorder} ${focusBorder}`}
        onMouseDown={(e) => {
          if (e.target === rootRef.current || (e.target as HTMLElement).closest("[data-ms-input]")) {
            inputRef.current?.focus();
          }
        }}
      >
        <MagnifyingGlass className="h-4 w-4 shrink-0 text-[#9CA3AF]" aria-hidden />
        {selectedRows.map((row) => (
          <span
            key={row.id}
            className="inline-flex max-w-full items-center gap-1 rounded-sm border border-brand-red/25 bg-red-50 px-2 py-0.5 text-xs font-semibold text-brand-red"
          >
            <span className="truncate">{row.label}</span>
            <button
              type="button"
              className="shrink-0 rounded p-0.5 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-1"
              aria-label={`Remove ${row.label}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => remove(row.id)}
            >
              <X className="h-3.5 w-3.5" weight="bold" aria-hidden />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          id={id}
          type="text"
          data-ms-input
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
          aria-autocomplete="list"
          autoComplete="off"
          placeholder={value.length ? searchPlaceholder : placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="min-w-[6rem] flex-1 border-0 bg-transparent py-1 text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF]"
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={open ? "Close list" : "Open list"}
          className="shrink-0 rounded p-1 text-[#9CA3AF] hover:bg-gray-100 hover:text-[#374151] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setOpen((v) => !v);
            inputRef.current?.focus();
          }}
        >
          <CaretDown className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden />
        </button>
      </div>

      {open && typeof document !== "undefined"
        ? createPortal(
            <ul
              ref={portalRef}
              id={listboxId}
              role="listbox"
              aria-multiselectable="true"
              style={panelStyle}
              className="overflow-auto rounded-sm border border-[#E5E7EB] bg-white py-1 shadow-lg"
            >
          {filtered.length === 0 ? (
            <li className="px-3 py-3 text-sm text-[#6B7280]">{emptyMessage}</li>
          ) : (
            filtered.map((opt) => {
              const selected = value.includes(opt.id);
              return (
                <li key={opt.id} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-red/40"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => toggle(opt.id)}
                  >
                    <span
                      className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-sm border ${
                        selected ? "border-brand-red bg-brand-red text-white" : "border-[#D1D5DB] bg-white"
                      }`}
                      aria-hidden
                    >
                      {selected ? <Check className="h-3 w-3" weight="bold" /> : null}
                    </span>
                    <span className={`leading-snug ${selected ? "font-semibold text-brand-red" : "font-normal text-[#374151]"}`}>
                      {opt.label}
                    </span>
                  </button>
                </li>
              );
            })
          )}
            </ul>,
            document.body
          )
        : null}
    </div>
  );
}
