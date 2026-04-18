/** Match frontend: allow 91, +91, 0091 → +CC (1–4 digits). */
export function normalizeDialCode(raw: string): string {
  let t = raw.trim().replace(/\s/g, '');
  if (!t) return t;
  if (t.startsWith('00') && t.length > 2) {
    t = `+${t.slice(2)}`;
  }
  if (/^\d{1,4}$/.test(t)) {
    t = `+${t}`;
  }
  return t;
}
