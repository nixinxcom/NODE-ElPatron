import type { Metadata } from "next";

export function strOrNull(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string") return v || null;
  try { const s = (v as any).toString?.(); return typeof s === "string" && s ? s : null; } catch { return null; }
}

export function baseDefaultsToMetaRecord(base: Metadata): Record<string, string | null> {
  const titleVal =
    typeof base.title === "string"
      ? base.title
      : ((base.title as any)?.absolute ?? (base.title as any)?.default ?? null);

  const ogImg = Array.isArray((base as any)?.openGraph?.images)
    ? ((base as any).openGraph.images[0]?.url ?? (base as any).openGraph.images[0] ?? null)
    : null;

  const twImg = Array.isArray((base as any)?.twitter?.images)
    ? ((base as any).twitter.images[0] ?? null)
    : null;

  return {
    title:                strOrNull(titleVal),
    description:          strOrNull(base.description),
    "og:title":           strOrNull((base as any)?.openGraph?.title),
    "og:description":     strOrNull((base as any)?.openGraph?.description),
    "og:image":           strOrNull(ogImg),
    "twitter:title":      strOrNull((base as any)?.twitter?.title),
    "twitter:description":strOrNull((base as any)?.twitter?.description),
    "twitter:image":      strOrNull(twImg),
  };
}
