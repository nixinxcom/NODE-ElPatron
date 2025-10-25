// app/lib/styles/styles.ts
// Resolución del styles seed por id/host (sin Firestore).
// SSOT: seeds/styles.ts (NO JSON)

import type { StylesDoc } from "./types";
import { stylesSeed as rawStylesSeed } from "@/seeds/styles";

/** Entrada flexible del seed:
 *  - Single: StylesDoc (+ opcional domain)
 *  - Map:  { [id]: StylesDoc & { domain?: string | string[] } }
 *  - También acepta envoltura { styles: StylesDoc }
 */
export type StylesSeed = (StylesDoc & { domain?: string | string[] }) | { styles: StylesDoc; domain?: string | string[] };
export type StylesMap = Record<string, StylesSeed>;

/* ---------------- utils ---------------- */
function normHost(input?: string | null): string | undefined {
  if (!input) return undefined;
  let h = input.split(",")[0].trim().toLowerCase();
  h = h
    .replace(/^https?:\/\//, "")
    .split("/")[0]
    .split(":")[0]
    .replace(/^www\./, "");
  return h.replace(/\/$/, "");
}

function domainsOf(cfg?: StylesSeed): string[] {
  if (!cfg || (cfg as any).domain == null) return [];
  const raw = (cfg as any).domain;
  const arr = Array.isArray(raw) ? raw : [raw];
  return arr
    .map((v) => normHost(String(v)))
    .filter((v): v is string => Boolean(v));
}

function isStylesDoc(x: any): x is StylesDoc {
  return !!x && (typeof x === "object") && (!!x.components || !!x.global);
}

function unwrap(seed: StylesSeed): StylesDoc {
  // Acepta seed con envoltura { styles: StylesDoc }
  return (seed as any).styles && isStylesDoc((seed as any).styles)
    ? ((seed as any).styles as StylesDoc)
    : (seed as StylesDoc);
}

/** Normaliza el seed TS a un MAP { id: StylesSeed } */
function normalizeToMap(seedAny: any): StylesMap {
  if (!seedAny) return {};
  // Caso 1: single doc (o doc envuelto)
  if (isStylesDoc(seedAny) || (seedAny.styles && isStylesDoc(seedAny.styles))) {
    return { default: seedAny as StylesSeed };
  }
  // Caso 2: mapa de ids
  const out: StylesMap = {};
  for (const [k, v] of Object.entries(seedAny)) {
    out[k] = v as StylesSeed;
  }
  return out;
}

/** Mapa directo desde el seed TS (no JSON) */
export const MAP: StylesMap = normalizeToMap(rawStylesSeed);

/* ---------------- API ---------------- */
export function getStylesById(id: string): StylesDoc | undefined {
  const cfg = MAP[id];
  return cfg ? unwrap(cfg) : undefined;
}

export function getStylesByHost(host?: string | null): StylesDoc | undefined {
  const h = normHost(host);
  if (!h) return undefined;
  for (const cfg of Object.values(MAP)) {
    if (domainsOf(cfg).includes(h)) return unwrap(cfg);
  }
  return undefined;
}

/** Prioridad: id → host → "default" */
export function resolveStyles(opts: { id?: string; host?: string | null } = {}): StylesDoc | undefined {
  const byId = opts.id ? getStylesById(opts.id) : undefined;
  if (byId) return byId;

  const byHost = getStylesByHost(opts.host);
  if (byHost) return byHost;

  const def = getStylesById("default");
  if (!def && process.env.NODE_ENV !== "production") {
    console.warn('[styles] Falta clave "default" en seeds/styles.ts');
  }
  return def;
}

/** Export conveniente del seed efectivo (p. ej. para tests o consumo directo) */
export const stylesSeedDoc: StylesDoc =
  resolveStyles({ id: "default" }) ??
  // fallback: primer item del mapa si no hay "default"
  (MAP && Object.keys(MAP).length ? unwrap((MAP as any)[Object.keys(MAP)[0]]) : ({} as StylesDoc));

export { stylesSeedDoc as stylesSeed };
export default stylesSeedDoc;
