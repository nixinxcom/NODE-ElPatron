// Resolución del settings seed por id/host (sin Firestore).
// SSOT ahora: seeds/settings (TSX). Si es single-tenant, se envuelve como { default: ... }.

import * as settingsSeedTsx from '@/seeds/settings';

/** Config de settings (separada para no colisionar con AgentConfig de branding) */
export type SettingsConfig = {
  displayName?: string;
  domain?: string | string[];
  languages?: string[] | string;
  openai?: { model?: string; temperature?: number; max_tokens?: number };
  params?: Record<string, any>;
  // agrega aquí campos propios de settings si los tienes
};

export type SettingsMap = Record<string, SettingsConfig>;

/** Util: tomar default | baseSettings | módulo crudo */
const pickSeed = (m: any) => (m?.default ?? m?.baseSettings ?? m ?? {}) as unknown as SettingsConfig | SettingsMap;

/** Extrae un MAP desde el módulo TSX:
 *  - Si el módulo exporta SETTINGS_MAP / MAP / map → lo usamos tal cual.
 *  - Si exporta un objeto simple (single-tenant) → lo envolvemos como { default: obj }.
 */
function extractMapFromTsxModule(m: any): SettingsMap {
  const candidates = [m?.SETTINGS_MAP, m?.MAP, m?.map, m?.settingsMap];
  for (const c of candidates) {
    if (c && typeof c === 'object' && !Array.isArray(c)) return c as SettingsMap;
  }
  const single = pickSeed(m);
  if (single && typeof single === 'object' && !Array.isArray(single)) {
    // single-tenant → lo envolvemos
    return { default: single as SettingsConfig };
  }
  return {};
}

/** Mapa directo del seed (ahora desde TSX) */
export const MAP: SettingsMap = extractMapFromTsxModule(settingsSeedTsx);

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

function domainsOf(cfg?: SettingsConfig): string[] {
  if (!cfg || !cfg.domain) return [];
  const arr = Array.isArray(cfg.domain) ? cfg.domain : [cfg.domain];
  return arr
    .map((v) => normHost(String(v)))
    .filter((v): v is string => Boolean(v));
}

/* ---------------- API ---------------- */
export function getSettingsById(id: string): SettingsConfig | undefined {
  return MAP[id];
}

export function getSettingsByHost(host?: string | null): SettingsConfig | undefined {
  const h = normHost(host);
  if (!h) return undefined;
  for (const cfg of Object.values(MAP)) {
    if (domainsOf(cfg).includes(h)) return cfg;
  }
  return undefined;
}

/** Prioridad: id → host → "default" */
export function resolveSettings(opts: { id?: string; host?: string | null }): SettingsConfig | undefined {
  const byId = opts.id && getSettingsById(opts.id);
  if (byId) return byId;

  const byHost = getSettingsByHost(opts.host);
  if (byHost) return byHost;

  const def = getSettingsById('default');
  if (!def) console.warn('[settings] Falta clave "default" en seed TSX de settings');
  return def;
}
