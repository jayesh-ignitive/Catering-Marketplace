import { MapPin } from "@phosphor-icons/react";
import type { AddressSearchSuggestion, AddressTextMatch } from "@/lib/workspace-address-search";

type TitleSegment = { text: string; matched: boolean };

function buildTitleSegments(
  text: string,
  matches: AddressTextMatch[] | undefined,
  query: string
): TitleSegment[] {
  if (matches?.length) {
    const segments: TitleSegment[] = [];
    let cursor = 0;
    const sorted = [...matches].sort((a, b) => a.startOffset - b.startOffset);
    for (const match of sorted) {
      if (match.startOffset > cursor) {
        segments.push({ text: text.slice(cursor, match.startOffset), matched: false });
      }
      segments.push({ text: text.slice(match.startOffset, match.endOffset), matched: true });
      cursor = match.endOffset;
    }
    if (cursor < text.length) {
      segments.push({ text: text.slice(cursor), matched: false });
    }
    return segments.filter((segment) => segment.text.length > 0);
  }

  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return [{ text, matched: false }];
  }

  const lower = text.toLowerCase();
  const queryLower = trimmedQuery.toLowerCase();
  const idx = lower.indexOf(queryLower);
  if (idx < 0) {
    return [{ text, matched: false }];
  }

  const segments: TitleSegment[] = [];
  if (idx > 0) segments.push({ text: text.slice(0, idx), matched: false });
  segments.push({ text: text.slice(idx, idx + trimmedQuery.length), matched: true });
  if (idx + trimmedQuery.length < text.length) {
    segments.push({ text: text.slice(idx + trimmedQuery.length), matched: false });
  }
  return segments;
}

function HighlightedTitle({
  title,
  query,
  matches,
}: {
  title: string;
  query: string;
  matches: AddressTextMatch[];
}) {
  const segments = buildTitleSegments(title, matches, query);
  return (
    <span className="block truncate text-sm leading-snug text-[#111827]">
      {segments.map((segment, index) => (
        <span
          key={`${index}-${segment.text}`}
          className={segment.matched ? "font-normal" : "font-semibold"}
        >
          {segment.text}
        </span>
      ))}
    </span>
  );
}

type Props = {
  suggestion: AddressSearchSuggestion;
  query: string;
  active?: boolean;
};

export function AddressSearchSuggestionRow({ suggestion, query, active = false }: Props) {
  return (
    <div
      className={`flex min-w-0 items-center gap-3 px-4 py-3 ${
        active ? "bg-[#F9FAFB]" : ""
      }`}
    >
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-[#F3F4F6] text-[#6B7280]"
        aria-hidden
      >
        <MapPin className="size-4" weight="regular" />
      </span>
      <span className="min-w-0 flex-1 text-left">
        {suggestion.title ? (
          <HighlightedTitle
            title={suggestion.title}
            query={query}
            matches={suggestion.titleMatches}
          />
        ) : (
          <span className="block truncate text-sm font-semibold leading-snug text-[#111827]">
            {suggestion.label}
          </span>
        )}
        {suggestion.subtitle ? (
          <span className="mt-0.5 block truncate text-sm leading-snug text-[#6B7280]">
            {suggestion.subtitle}
          </span>
        ) : null}
      </span>
    </div>
  );
}
