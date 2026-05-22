/** Apply flat `a.b.c` overrides onto a nested message tree; missing keys keep English. */
export function applyLocaleOverrides<T extends object>(base: T, flat: Record<string, string>): T {
  function walk(obj: unknown, prefix: string): unknown {
    if (typeof obj === "string") {
      return flat[prefix] ?? obj;
    }
    if (obj !== null && typeof obj === "object" && !Array.isArray(obj)) {
      const out: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
        const path = prefix ? `${prefix}.${key}` : key;
        out[key] = walk(value, path);
      }
      return out;
    }
    return obj;
  }
  return walk(base, "") as T;
}
