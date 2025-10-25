// complements/data/settingsFS.ts  ← sin "use client"
import { doc, getDoc, setDoc } from "firebase/firestore";
import { FbDB } from "@/app/lib/services/firebase";
import type iSettings from "@/app/lib/settings/interface";
import { resolveFMToStrings } from "@/complements/utils/resolveFM";
import { toShortLocale, DEFAULT_LOCALE_SHORT } from '@/app/lib/i18n/locale';

// --------- Seeds (solo TSX) ---------
import * as settingsSeedModule from "@/seeds/settings";

// Acepta default | baseSettings | módulo crudo
const pickSeed = (m: any) =>
  (m?.default ?? m?.baseSettings ?? m ?? {}) as Partial<iSettings>;

const TSX_SEED = pickSeed(settingsSeedModule) as Partial<iSettings>;

// --------- FS path ---------
const DEFAULT_PATH =
  process.env.NEXT_PUBLIC_SETTINGS_DOC_PATH || "settings/default";
const isValidDocPath = (p: string) => p.split("/").filter(Boolean).length % 2 === 0;

// --------- utils ---------
const isObj = (v: any) => v && typeof v === "object" && !Array.isArray(v);

/** overlay(a,b): deep merge donde SIEMPRE gana b; arrays se reemplazan */
function overlay(a: any, b: any): any {
  if (b === undefined) return a;
  if (a === undefined) return b;
  if (Array.isArray(a) && Array.isArray(b)) return b.slice();
  if (isObj(a) && isObj(b)) {
    const out: any = { ...a };
    for (const k of Object.keys(b)) out[k] = overlay(a[k], b[k]);
    return out;
  }
  return b;
}

async function loadFS(path = DEFAULT_PATH): Promise<Partial<iSettings> | undefined> {
  if (!isValidDocPath(path)) return undefined;
  try {
    const s = await getDoc(doc(FbDB, path));
    return s.exists() ? (s.data() as Partial<iSettings>) : undefined;
  } catch {
    return undefined;
  }
}

// --------- API pública ---------

/** Efectivo = TSX → FS, resuelto con i18n (prioridad: FS > TSX(FM) > TSX) */
export async function getSettingsEffective(
  path = DEFAULT_PATH,
  locale?: string
): Promise<iSettings> {
  // 1) Base solo TSX
  const seed = TSX_SEED as iSettings;

  // 2) FS pisa todo
  const fs = await loadFS(path);
  const merged = (fs ? overlay(seed, fs) : seed) as iSettings;

  // 3) Resolver <FM/> con el diccionario del locale (seed i18n + FS i18n)
  const loc =
    locale ??
    process.env.NEXT_PUBLIC_DEFAULT_LOCALE ??
    (process.env.LC_ALL ||
      process.env.LC_MESSAGES ||
      process.env.LANG ||
      process.env.LANGUAGE)?.replace(".UTF-8", "").replace("_", "-") ??
    Intl.DateTimeFormat().resolvedOptions().locale ??
    DEFAULT_LOCALE_SHORT;

  // Carga dict: en server usamos REST helper; en client el SDK web
  let dict: Record<string, string> = {};
  if (typeof window === "undefined") {
    const { getI18nEffectiveServer } = await import("@/complements/data/i18nFS.server");
    dict = await getI18nEffectiveServer(loc);
  } else {
    const { getI18nEffective } = await import("@/complements/data/i18nFS");
    dict = await getI18nEffective(loc);
  }

  return resolveFMToStrings<iSettings, iSettings>(merged, dict);
}

export async function getSettingsAdminRaw(path = DEFAULT_PATH): Promise<iSettings> {
  const fs = await loadFS(path);
  return overlay(TSX_SEED, fs) as iSettings; // conserva posibles <FM/>
}

export async function saveSettingsClient(partial: Partial<iSettings>, path = DEFAULT_PATH) {
  if (!isValidDocPath(path)) throw new Error("Invalid settings doc path");
  await setDoc(doc(FbDB, path), partial, { merge: true });
}

export function getSettingsDocPath() {
  return DEFAULT_PATH;
}

// --------- Debug opcional (para /api/debug) ---------
export async function __settingsDebug(path = DEFAULT_PATH, locale = DEFAULT_LOCALE_SHORT) {
  const fs = await loadFS(path);
  const seed = TSX_SEED;
  const merged = fs ? overlay(seed, fs) : seed;

  let dict: Record<string, string> = {};
  if (typeof window === "undefined") {
    const { getI18nEffectiveServer } = await import("@/complements/data/i18nFS.server");
    dict = await getI18nEffectiveServer(locale);
  } else {
    const { getI18nEffective } = await import("@/complements/data/i18nFS");
    dict = await getI18nEffective(locale);
  }

  const effective = resolveFMToStrings(merged, dict);
  return {
    scope: "settings",
    path,
    locale,
    seedTsx: TSX_SEED,
    fsGlobal: fs,
    effective,
  };
}
