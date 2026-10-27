/**
 * Where to send the user after login. The target comes from a `?redirect=`
 * query parameter anyone can put in a link, so it must stay on this site.
 *
 * A plain `startsWith("/") && !startsWith("//")` check is NOT enough: browsers
 * treat a backslash like a slash, so `/\evil.example` resolves to
 * `//evil.example` (another site), and control characters (tab/newline) are
 * silently stripped by URL parsers, turning `/<tab>/evil.example` into
 * `//evil.example` as well. The final check resolves the value against a dummy
 * origin and requires it to stay on that origin.
 */
export function resolveRedirectTarget(raw: string | null | undefined, fallback = "/dashboard"): string {
  if (!raw || typeof raw !== "string") return fallback
  if (raw.length > 512) return fallback
  if (!raw.startsWith("/") || raw.startsWith("//")) return fallback
  // eslint-disable-next-line no-control-regex
  if (/[\\\u0000-\u001f\u007f]/.test(raw)) return fallback
  try {
    const base = "https://app.invalid"
    const resolved = new URL(raw, base)
    if (resolved.origin !== base) return fallback
    // Never bounce back into the auth screens themselves.
    if (resolved.pathname === "/login" || resolved.pathname.startsWith("/login/")) return fallback
    const normalised = `${resolved.pathname}${resolved.search}${resolved.hash}`
    // Dot-segments can collapse a harmless-looking path into "//host" ("/x/..//evil").
    // Re-check the NORMALISED value, and refuse encoded slashes/backslashes at its start.
    if (!normalised.startsWith("/") || normalised.startsWith("//") || /^\/(%5c|%2f)/i.test(normalised)) return fallback
    return normalised
  } catch {
    return fallback
  }
}
