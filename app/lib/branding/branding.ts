// Resolución del branding seed por id/host (sin Firestore).
// SSOT ahora: seeds/branding (TSX). Si es single-tenant, se envuelve como { default: ... }.

import * as brandingSeedTsx from '@/seeds/branding';

/** Config de una marca (ajusta si tu seed tiene más campos) */
export type AgentConfig = {
  displayName?: string;
  domain?: string | string[];
  languages?: string[] | string;
  openai?: { model?: string; temperature?: number; max_tokens?: number };
  params?: Record<string, any>;
};

export type BrandingMap = Record<string, AgentConfig>;

/** Intenta extraer un MAP del módulo TSX:
 *  - Si exporta BRANDING_MAP / MAP / map / brandingMap → usar tal cual.
 *  - Si exporta un objeto simple (single-tenant) → envolver como { default: obj }.
 */
function extractMapFromTsxModule(m: any): BrandingMap {
  const candidates = [m?.BRANDING_MAP, m?.MAP, m?.map, m?.brandingMap, m?.brandsMap];
  for (const c of candidates) {
    if (c && typeof c === 'object' && !Array.isArray(c)) return c as BrandingMap;
  }
  const single = (m?.default ?? m?.baseBranding ?? m ?? {}) as AgentConfig | Record<string, any>;
  if (single && typeof single === 'object' && !Array.isArray(single)) {
    return { default: single as AgentConfig };
  }
  return {};
}

/** Mapa directo desde el seed TSX */
export const MAP: BrandingMap = extractMapFromTsxModule(brandingSeedTsx);

/* ---------------- utils ---------------- */
function normHost(input?: string | null): string | undefined {
  if (!input) return undefined;
  let h = input.split(',')[0].trim().toLowerCase();
  h = h
    .replace(/^https?:\/\//, '')
    .split('/')[0]
    .split(':')[0]
    .replace(/^www\./, '');
  return h.replace(/\/$/, '');
}

function domainsOf(cfg?: AgentConfig): string[] {
  if (!cfg || !cfg.domain) return [];
  const arr = Array.isArray(cfg.domain) ? cfg.domain : [cfg.domain];
  return arr
    .map((v) => normHost(String(v)))
    .filter((v): v is string => Boolean(v));
}

/* ---------------- API ---------------- */
export function getBrandById(id: string): AgentConfig | undefined {
  return MAP[id];
}

export function getBrandByHost(host?: string | null): AgentConfig | undefined {
  const h = normHost(host);
  if (!h) return undefined;
  for (const cfg of Object.values(MAP)) {
    if (domainsOf(cfg).includes(h)) return cfg;
  }
  return undefined;
}

/** Prioridad: id → host → "default" */
export function resolveBrand(opts: { id?: string; host?: string | null }): AgentConfig | undefined {
  const byId = opts.id && getBrandById(opts.id);
  if (byId) return byId;

  const byHost = getBrandByHost(opts.host);
  if (byHost) return byHost;

  const def = getBrandById('default');
  if (!def) console.warn('[branding] Falta clave "default" en seed TSX de branding');
  return def;
}
