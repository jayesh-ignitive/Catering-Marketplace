import { useEffect, useState } from "react";

/** Default delay for admin list search boxes (ms). */
export const ADMIN_SEARCH_DEBOUNCE_MS = 400;

/** Returns `value` after it has stayed unchanged for `delayMs` milliseconds. */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
