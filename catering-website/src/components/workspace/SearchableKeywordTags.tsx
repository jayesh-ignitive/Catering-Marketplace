"use client";

import { CaretDown, MagnifyingGlass, Plus, X } from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAnchoredFixedPanelStyle } from "./useAnchoredFixedPanelStyle";

/** Same cap as backend `WorkspaceProfileStep1Dto.keywords` `ArrayMaxSize`. */
export const WORKSPACE_KEYWORD_LIMIT = 10;
const MAX_KEYWORDS = WORKSPACE_KEYWORD_LIMIT;
const BROWSE_LIMIT = 45;

type Suggestion = { slug: string; label: string };

type SearchableKeywordTagsProps = {
  value: string[];
  onChange: (next: string[]) => void;
  fetchSuggestions: (term: string) => Promise<Suggestion[]>;
  /**
   * Keywords already used on published listings (`GET .../caterers/keywords`).
   * Shown when the panel opens so users see options without typing first.
   */
  browseCatalog?: Suggestion[];
  placeholder?: string;
  searchPlaceholder?: string;
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  errored?: boolean;
  className?: string;
};

function normalizeKeyword(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}

function hasKeywordInsensitive(list: string[], candidate: string): boolean {
  const c = candidate.trim().toLowerCase();
  return list.some((x) => x.trim().toLowerCase() === c);
}

function uniqSuggestions(rows: Suggestion[]): Suggestion[] {
  const seen = new Set<string>();
  const out: Suggestion[] = [];
  for (const r of rows) {
    const k = `${r.slug}\0${r.label.trim().toLowerCase()}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(r);
  }
  return out;
}

export function SearchableKeywordTags({
  value,
  onChange,
  fetchSuggestions,
  browseCatalog = [],
  placeholder = "Search popular keywords or type your own…",
  searchPlaceholder = "Add more keywords…",
  id,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  errored = false,
  className = "",
}: SearchableKeywordTagsProps) {
  const listboxId = `${id ?? "kw-tags"}-listbox`;
  const rootRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [apiSuggestions, setApiSuggestions] = useState<Suggestion[]>([]);
  const [apiLoading, setApiLoading] = useState(false);

  const canAddMore = value.length < MAX_KEYWORDS;

  const runSuggest = useCallback(
    async (term: string) => {
      const t = normalizeKeyword(term);
      if (t.length < 1) {
        setApiSuggestions([]);
        return;
      }
      setApiLoading(true);
      try {
        const rows = await fetchSuggestions(t);
        setApiSuggestions(rows.filter((r) => !hasKeywordInsensitive(value, r.label)).slice(0, 15));
      } finally {
        setApiLoading(false);
      }
    },
    [fetchSuggestions, value]
  );

  useEffect(() => {
    const t = query.trim();
    if (t.length < 1) {
      setApiSuggestions([]);
      return;
    }
    const handle = window.setTimeout(() => {
      void runSuggest(t);
    }, 220);
    return () => window.clearTimeout(handle);
  }, [query, runSuggest]);

  const queryTrim = normalizeKeyword(query);
  const qLower = queryTrim.toLowerCase();

  const browseMatches = useMemo(() => {
    const rows = browseCatalog.filter((r) => !hasKeywordInsensitive(value, r.label));
    if (!qLower) return rows.slice(0, BROWSE_LIMIT);
    return rows.filter((r) => r.label.toLowerCase().includes(qLower)).slice(0, BROWSE_LIMIT);
  }, [browseCatalog, value, qLower]);

  const displayRows = useMemo(() => {
    return uniqSuggestions([...browseMatches, ...apiSuggestions]).slice(0, BROWSE_LIMIT);
  }, [browseMatches, apiSuggestions]);

  const showCreateRow =
    queryTrim.length > 0 &&
    !hasKeywordInsensitive(value, queryTrim) &&
    canAddMore &&
    !displayRows.some((s) => s.label.trim().toLowerCase() === queryTrim.toLowerCase());

  const panelStyle = useAnchoredFixedPanelStyle(
    open && canAddMore,
    anchorRef,
    `${query}-${displayRows.length}-${showCreateRow ? 1 : 0}-${apiLoading ? 1 : 0}`
  );

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

  const addKeyword = (raw: string) => {
    const next = normalizeKeyword(raw);
    if (!next || value.length >= MAX_KEYWORDS) return;
    if (hasKeywordInsensitive(value, next)) return;
    if (next.length > 120) return;
    onChange([...value, next]);
    setQuery("");
    setApiSuggestions([]);
  };

  const removeKeyword = (label: string) => {
    onChange(value.filter((x) => x.trim().toLowerCase() !== label.trim().toLowerCase()));
  };

  const shellBorder = errored ? "border-brand-red" : "border-[#E5E7EB]";
  const focusBorder = "focus-within:border-brand-red";

  const shellSurface = `flex min-h-[52px] cursor-text flex-wrap items-center gap-1.5 rounded-sm border bg-white px-3 py-2 transition-colors outline-none ring-0 ring-offset-0 ${shellBorder} ${focusBorder}`;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <div
        ref={anchorRef}
        className={shellSurface}
        onMouseDown={(e) => {
          if ((e.target as HTMLElement).closest("[data-kw-input]")) return;
          inputRef.current?.focus();
        }}
      >
        <MagnifyingGlass className="h-4 w-4 shrink-0 text-[#9CA3AF]" aria-hidden />
        {value.map((kw, idx) => (
          <span
            key={`${idx}-${kw}`}
            className="inline-flex max-w-full items-center gap-1 rounded-sm border border-brand-red/25 bg-red-50 px-2 py-0.5 text-xs font-semibold text-brand-red"
          >
            <span className="truncate">{kw}</span>
            <button
              type="button"
              className="shrink-0 rounded p-0.5 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-1"
              aria-label={`Remove keyword ${kw}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => removeKeyword(kw)}
            >
              <X className="h-3.5 w-3.5" weight="bold" aria-hidden />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          id={id}
          type="text"
          data-kw-input
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
          aria-autocomplete="list"
          autoComplete="off"
          disabled={!canAddMore}
          placeholder={value.length ? searchPlaceholder : placeholder}
          value={query}
          maxLength={120}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (queryTrim && canAddMore) {
                addKeyword(queryTrim);
              }
            }
          }}
          className="min-w-[6rem] flex-1 border-0 bg-transparent py-1 text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF] disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={open ? "Close suggestions" : "Open suggestions"}
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

      {!canAddMore ? (
        <p className="mt-1 text-xs text-[#6B7280]">Maximum {MAX_KEYWORDS} keywords reached. Remove one to add another.</p>
      ) : null}

      {open && canAddMore && typeof document !== "undefined"
        ? createPortal(
            <ul
              ref={portalRef}
              id={listboxId}
              role="listbox"
              aria-multiselectable="false"
              style={panelStyle}
              className="overflow-auto rounded-sm border border-[#E5E7EB] bg-white py-1 shadow-lg"
            >
          {!qLower && browseCatalog.length > 0 ? (
            <li className="border-b border-[#F3F4F6] px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-[#6B7280]">
              Popular on marketplace
            </li>
          ) : null}
          {!qLower && browseCatalog.length === 0 ? (
            <li className="border-b border-[#F3F4F6] px-3 py-2 text-xs leading-snug text-[#6B7280]">
              No keyword list yet (needs published listings). Type your own phrase below — press Enter or Add.
            </li>
          ) : null}
          {apiLoading && qLower.length > 0 ? (
            <li className="px-3 py-2 text-sm text-[#6B7280]">Searching…</li>
          ) : null}
          {!apiLoading && qLower.length > 0 && displayRows.length === 0 && !showCreateRow ? (
            <li className="px-3 py-2 text-sm text-[#6B7280]">
              No matches in our list — add your own phrase below.
            </li>
          ) : null}
          {displayRows.map((s) => (
            <li key={`${s.slug}-${s.label}`} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={false}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-[#374151] transition-colors hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-red/40"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => addKeyword(s.label)}
              >
                <Plus className="h-4 w-4 shrink-0 text-brand-red" weight="bold" aria-hidden />
                <span>{s.label}</span>
              </button>
            </li>
          ))}
          {showCreateRow ? (
            <li role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={false}
                className="flex w-full items-center gap-2 border-t border-[#F3F4F6] px-3 py-2.5 text-left text-sm font-semibold text-brand-red transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-red/40"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => addKeyword(queryTrim)}
              >
                <Plus className="h-4 w-4 shrink-0" weight="bold" aria-hidden />
                Add &quot;{queryTrim}&quot;
              </button>
            </li>
          ) : null}
            </ul>,
            document.body
          )
        : null}
    </div>
  );
}
