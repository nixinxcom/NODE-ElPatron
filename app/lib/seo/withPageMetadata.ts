// app/lib/seo/withPageMetadata.ts
// Mezcla defaults del repo (DEFAULT_META_*) con Firestore (global/site/page)
// y respeta tu buildMetadata/pageMeta. Firma compatible con Next 15.

import type { Metadata, ResolvingMetadata } from "next";
import { buildMetadata } from "@/app/lib/seo/meta";
import { pageMeta } from "@/app/lib/seo/pages";
import {
  getEffectiveMetaServer,
  metaRecordToNext,
  deepMerge,
  loadMetaGlobalServer,
  loadMetaSiteServer,
} from "@/app/lib/seo/meta.server";
import {
  DEFAULT_META_GLOBAL,
  DEFAULT_META_SITE,
} from "@/app/lib/seo/defaults";

/* ─────────────────────────────────────────────────────────────
   Helpers
─────────────────────────────────────────────────────────────── */
async function unwrapParams<T extends { locale?: string }>(
  props: any
): Promise<T> {
  // Next puede pasar props.params directo o como Promise
  const p = props?.params;
  // si tiene .then, asumimos promise
  const isPromise = p && typeof p.then === "function";
  return (isPromise ? await p : p) as T;
}

function strOrNull(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string") return v || null;
  try {
    const s = (v as any)?.toString?.();
    return typeof s === "string" && s ? s : null;
  } catch {
    return null;
  }
}

function baseDefaultsToMetaRecord(base: Metadata): Record<string, string | null> {
  const titleVal =
    typeof base.title === "string"
      ? base.title
      : ((base.title as any)?.absolute ?? (base.title as any)?.default ?? null);

  const ogImg = Array.isArray((base as any)?.openGraph?.images)
    ? ((base as any).openGraph.images[0]?.url ??
       (base as any).openGraph.images[0] ??
       null)
    : null;

  const twImg = Array.isArray((base as any)?.twitter?.images)
    ? ((base as any).twitter.images[0] ?? null)
    : null;

  return {
    title:                 strOrNull(titleVal),
    description:           strOrNull(base.description),
    "og:title":            strOrNull((base as any)?.openGraph?.title),
    "og:description":      strOrNull((base as any)?.openGraph?.description),
    "og:image":            strOrNull(ogImg),
    "twitter:title":       strOrNull((base as any)?.twitter?.title),
    "twitter:description": strOrNull((base as any)?.twitter?.description),
    "twitter:image":       strOrNull(twImg),
  };
}

/* ─────────────────────────────────────────────────────────────
   One-liner por PÁGINA (page)
─────────────────────────────────────────────────────────────── */
export function withPageMetadata(opts: {
  routeKey: string;
  pageMetaKey?: keyof typeof pageMeta;
}) {
  return async function generateMetadata(
    props: any, // <- importante: any para satisfacer PageProps del checker
    _parent: ResolvingMetadata
  ): Promise<Metadata> {
    const { locale } = await unwrapParams<{ locale?: string }>(props);

    // 1) Base editorial del repo
    const mk = (opts.pageMetaKey ?? (opts.routeKey as keyof typeof pageMeta));
    const base = await buildMetadata((pageMeta as any)[mk] ?? pageMeta.home);

    // 2) Defaults del repo (plano)
    const defaultsFromBase = baseDefaultsToMetaRecord(base);
    const repoDefaultsFlat = { ...DEFAULT_META_GLOBAL, ...DEFAULT_META_SITE };

    // 3) Efectivo Global/Site/Page desde Firestore (prioridad FS)
    const rec = await getEffectiveMetaServer(
      opts.routeKey,
      locale ?? "es",
      { ...repoDefaultsFlat, ...defaultsFromBase }
    );

    // 4) Override parcial → merge no destructivo con base
    const override = metaRecordToNext(rec);
    return deepMerge(base, override as Metadata);
  };
}

/* ─────────────────────────────────────────────────────────────
   One-liner para el LAYOUT de (sites)
─────────────────────────────────────────────────────────────── */
export function withSitesLayoutMetadata() {
  return async function generateMetadata(
    props: any, // <- any para evitar conflictos con PageProps
    _parent: ResolvingMetadata
  ): Promise<Metadata> {
    const { locale } = await unwrapParams<{ locale?: string }>(props);

    const [g, s] = await Promise.all([
      loadMetaGlobalServer(locale ?? "es"),
      loadMetaSiteServer(locale ?? "es"),
    ]);

    // Mezcla: defaults del repo < Firestore (gana Firestore)
    return metaRecordToNext({
      ...DEFAULT_META_GLOBAL,
      ...DEFAULT_META_SITE,
      ...(g || {}),
      ...(s || {}),
    });
  };
}
