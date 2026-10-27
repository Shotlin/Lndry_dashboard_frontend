/**
 * Links in the admin console that point at URLs supplied by other people
 * (rider documents, review photos, a vendor's Google profile) must never carry a
 * `javascript:` / `data:` URL: clicking one would run script as the signed-in
 * admin. Only absolute http(s) URLs are returned; anything else becomes
 * `undefined` so the caller can render plain text instead of a link.
 */
export function safeExternalUrl(value: string | null | undefined): string | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > 2048) return undefined
  try {
    const url = new URL(trimmed)
    if (url.protocol !== "https:" && url.protocol !== "http:") return undefined
    return url.toString()
  } catch {
    return undefined
  }
}
