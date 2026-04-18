"use client";

import { CaretDown, MagnifyingGlass } from "@phosphor-icons/react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

export type HeroAutocompleteOption = { id: string; name: string };

type HeroAutocompleteProps = {
  label: string;
  placeholder: string;
  options: HeroAutocompleteOption[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
};

function normalize(s: string) {
  return s.trim().toLowerCase();
}

export function HeroAutocomplete({
  label,
  placeholder,
  options,
  value,
  onChange,
  disabled,
}: HeroAutocompleteProps) {
  const baseId = useId();
  const listId = `${baseId}-list`;
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);

  const selected = useMemo(() => options.find((o) => o.id === value), [options, value]);

  /** Keep input label in sync when a valid option is selected (by id), without clearing user typing when id is cleared. */
  useEffect(() => {
    if (selected) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- mirror controlled selection into local query for combobox UX
      setQuery(selected.name);
    }
  }, [selected]);

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return options;
    return options.filter((o) => normalize(o.name).includes(q));
  }, [options, query]);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        close();
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open, close]);

  function pick(option: HeroAutocompleteOption) {
    onChange(option.id);
    setQuery(option.name);
    setOpen(false);
    inputRef.current?.blur();
  }

  function onInputChange(s: string) {
    setQuery(s);
    setOpen(true);
    if (!s.trim()) {
      onChange("");
      return;
    }
    if (value) {
      const cur = options.find((o) => o.id === value);
      if (cur && normalize(s) !== normalize(cur.name)) {
        onChange("");
      }
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (disabled) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.min(h + 1, Math.max(0, filtered.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && filtered[highlight]) {
        pick(filtered[highlight]!);
      }
    } else if (e.key === "Escape") {
      close();
      inputRef.current?.blur();
    }
  }

  return (
    <div ref={wrapRef} className="relative flex flex-1 flex-col">
      <span className="sr-only">{label}</span>
      <div
        className={`flex cursor-text items-center gap-2 rounded border border-white/40 bg-black/25 px-3 py-3 backdrop-blur-sm transition-colors hover:border-white/60 focus-within:border-brand-yellow/80 focus-within:ring-2 focus-within:ring-brand-yellow/30 ${
          disabled ? "opacity-50" : ""
        }`}
      >
        <MagnifyingGlass className="shrink-0 text-white/70" size={20} aria-hidden />
        <input
          ref={inputRef}
          id={`${baseId}-input`}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-label={label}
          placeholder={placeholder}
          autoComplete="off"
          disabled={disabled}
          value={query}
          onChange={(e) => onInputChange(e.target.value)}
          onFocus={() => {
            if (disabled) return;
            setHighlight(0);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-white outline-none placeholder:text-white/50 placeholder:font-normal"
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          aria-hidden
          className="shrink-0 rounded p-0.5 text-white/60 transition hover:text-white"
          onClick={() => {
            if (disabled) return;
            setOpen((o) => !o);
            inputRef.current?.focus();
          }}
        >
          <CaretDown
            size={18}
            className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>
      </div>

      {open && !disabled && filtered.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-52 overflow-y-auto rounded-lg border border-white/15 bg-brand-dark/98 py-1 shadow-2xl ring-1 ring-black/40 backdrop-blur-md"
        >
          {filtered.map((opt, i) => (
            <li key={opt.id} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={value === opt.id}
                className={`flex w-full cursor-pointer px-3 py-2.5 text-left text-sm font-medium transition ${
                  i === highlight
                    ? "bg-white/15 text-white"
                    : "text-white/90 hover:bg-white/10"
                } ${value === opt.id ? "font-semibold text-brand-yellow" : ""}`}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(opt)}
              >
                {opt.name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {open && !disabled && query && filtered.length === 0 ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 rounded-lg border border-white/15 bg-brand-dark/98 px-3 py-3 text-sm text-white/70 shadow-xl backdrop-blur-md">
          No matches — try another spelling.
        </div>
      ) : null}
    </div>
  );
}
