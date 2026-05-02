"use client";

import { CaretDown, MagnifyingGlass } from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";

export type SearchableSingleSelectOption = { id: string; label: string };

type SearchableSingleSelectProps = {
  options: SearchableSingleSelectOption[];
  value: string;
  onChange: (nextId: string) => void;
  placeholder?: string;
  /** When a value is selected, shown in the input until user searches again */
  searchPlaceholder?: string;
  emptyMessage?: string;
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  errored?: boolean;
  className?: string;
};

export function SearchableSingleSelect({
  options,
  value,
  onChange,
  placeholder = "Search to select…",
  searchPlaceholder = "Type to filter cities…",
  emptyMessage = "No matching options.",
  id,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  errored = false,
  className = "",
}: SearchableSingleSelectProps) {
  const listboxId = `${id ?? "search-ss"}-listbox`;
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedOption = useMemo(
    () => options.find((o) => o.id === value) ?? null,
    [options, value]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const el = rootRef.current;
      if (el && !el.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const pick = (optId: string) => {
    onChange(optId);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  };

  const shellBorder = errored ? "border-brand-red" : "border-[#E5E7EB]";
  const focusBorder = "focus-within:border-brand-red";

  const shellSurface = `flex min-h-[52px] cursor-text items-center gap-2 rounded-sm border bg-white px-3 py-2 transition-colors outline-none ring-0 ring-offset-0 ${shellBorder} ${focusBorder}`;

  const showCompactLabel = Boolean(selectedOption && !open && query === "");

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <div
        className={shellSurface}
        onMouseDown={(e) => {
          const t = e.target as HTMLElement;
          if (t.closest("[data-ss-input]") || t.closest("[data-ss-summary]")) return;
          inputRef.current?.focus();
        }}
      >
        <MagnifyingGlass className="h-4 w-4 shrink-0 text-[#9CA3AF]" aria-hidden />
        {showCompactLabel ? (
          <button
            type="button"
            data-ss-summary
            className="min-w-0 flex-1 truncate py-1 text-left text-sm font-semibold text-[#111827] hover:text-brand-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-1"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setOpen(true);
              setQuery("");
              queueMicrotask(() => inputRef.current?.focus());
            }}
          >
            {selectedOption!.label}
          </button>
        ) : (
          <input
            ref={inputRef}
            id={id}
            type="text"
            data-ss-input
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-invalid={ariaInvalid}
            aria-describedby={ariaDescribedBy}
            aria-autocomplete="list"
            autoComplete="off"
            placeholder={value ? searchPlaceholder : placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            className="min-w-0 flex-1 border-0 bg-transparent py-1 text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF]"
          />
        )}
        <button
          type="button"
          tabIndex={-1}
          aria-label={open ? "Close list" : "Open list"}
          className="shrink-0 rounded p-1 text-[#9CA3AF] hover:bg-gray-100 hover:text-[#374151] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setOpen((v) => !v);
            queueMicrotask(() => inputRef.current?.focus());
          }}
        >
          <CaretDown className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden />
        </button>
      </div>

      {open ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-sm border border-[#E5E7EB] bg-white py-1 shadow-lg"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-3 text-sm text-[#6B7280]">{emptyMessage}</li>
          ) : (
            filtered.map((opt) => {
              const selected = opt.id === value;
              return (
                <li key={opt.id} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={`flex w-full px-3 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-red/40 ${
                      selected ? "font-semibold text-brand-red" : "font-normal text-[#374151]"
                    }`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(opt.id)}
                  >
                    {opt.label}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}
