// app/lib/styles/defaults.ts
// Carga de defaults de styles desde seed TS (sin tocar el shape).
// Usa DEFAULT_STYLES solo como fallback si no hay seed disponible.

import "server-only";
import { toShortLocale, DEFAULT_LOCALE_SHORT } from '@/app/lib/i18n/locale';

export type StyleRecord = Record<string, any>;

// Si NO quieres defaults, deja este objeto vacío {}.
export const DEFAULT_STYLES: StyleRecord = {};

type Rec = Record<string, unknown>;
const isRecord = (x: unknown): x is Rec => typeof x === "object" && x !== null;
const has     = (o: unknown, k: string): boolean =>
  isRecord(o) && k in (o as Rec);
const hasAny  = (o: unknown, ks: readonly string[]): boolean =>
  isRecord(o) && ks.some(k => k in (o as Rec));

export function deepMerge<T extends Record<string, any>>(a: T, b?: Partial<T>): T {
  if (!b) return a;
  const out: Record<string, any> = Array.isArray(a) ? [...a] : { ...a };
  for (const k of Object.keys(b)) {
    const av = out[k];
    const bv = (b as any)[k];
    out[k] = isRecord(av) && isRecord(bv) ? deepMerge(av as any, bv as any) : bv;
  }
  return out as T;
}

function baseLocale(loc?: string) {
  return toShortLocale(loc ?? DEFAULT_LOCALE_SHORT);
}

// Acepta seed plano, o seed con locales: { "*": {...}, es: {...}, en: {...} }
function pickLocaleFromSeed(seed: Record<string, any>, locale?: string) {
  if (!seed || typeof seed !== "object") return {};
  const base = baseLocale(locale);
  if ("*" in seed || "es" in seed || "en" in seed || "fr" in seed) {
    const common = (seed["*"] ?? {}) as Record<string, any>;
    const byLoc  = (seed[base] ?? {}) as Record<string, any>;
    return deepMerge(common, byLoc);
  }
  return seed; // seed plano (mismo para todos los locales)
}

/** Devuelve un StylesRecord a partir de cualquier forma del seed. */
function normalizeSeedToDoc(seedAny: unknown, locale?: string): StyleRecord {
  if (!isRecord(seedAny)) return {};

  // Caso “map por id”: { default: {...}, otraMarca: {...} }
  const keys = Object.keys(seedAny);
  const looksLikeMap =
    keys.length > 0 &&
    keys.every(k => isRecord((seedAny as Rec)[k])) &&
    keys.some(k => {
      const v = (seedAny as Rec)[k];
      return hasAny(v, ["styles", "components", "global", "*", "es", "en", "fr"]);
    });

  if (looksLikeMap) {
    const map = seedAny as Rec;
    const entry = (map["default"] as unknown) ?? (map[keys[0]] as unknown);
    const inner = has(entry, "styles") ? ((entry as Rec)["styles"]) : entry;
    return pickLocaleFromSeed(inner as Record<string, any>, locale) as StyleRecord;
  }

  // Caso “single” o envuelto { styles: {...} }
  const single = has(seedAny, "styles") ? (seedAny as Rec)["styles"] : seedAny;
  return pickLocaleFromSeed(single as Record<string, any>, locale) as StyleRecord;
}

/**
 * Lee el seed de styles desde TS y aplica el merge por locale.
 * - Si hay seed: regresa el seed (mezclado con '*').
 * - Si NO hay seed: regresa DEFAULT_STYLES.
 */
export async function getStylesDefaultsServer(locale?: string): Promise<StyleRecord> {
  // Import dinámico para entornos server/serverless sin tocar el bundling.
  const mod = await (async () => {
    try {
      const m: any = await import("@/seeds/styles");
      return m;
    } catch {
      return null;
    }
  })();

  const raw = mod ? (mod.stylesSeed ?? mod.default ?? mod) : null;
  if (raw) return normalizeSeedToDoc(raw, locale);

  return DEFAULT_STYLES as StyleRecord;
}
