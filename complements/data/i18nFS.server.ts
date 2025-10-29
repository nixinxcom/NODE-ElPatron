// NO "use client"

type FirestoreValue =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { nullValue: null }
  | { arrayValue: { values?: FirestoreValue[] } }
  | { mapValue: { fields?: Record<string, FirestoreValue> } };

function fromValue(v: any): any {
  if (!v || typeof v !== "object") return undefined;
  if ("stringValue" in v)  return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v)  return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("nullValue" in v)    return null;
  if ("arrayValue" in v)   return (v.arrayValue.values || []).map(fromValue);
  if ("mapValue" in v)     return fromFields(v.mapValue.fields || {});
  return undefined;
}

function fromFields(fields: Record<string, FirestoreValue> | undefined): any {
  const out: any = {};
  for (const [k, v] of Object.entries(fields || {})) out[k] = fromValue(v);
  return out;
}

async function fetchDocREST(projectId: string, apiKey: string, coll: string, id: string) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${coll}/${encodeURIComponent(id)}?key=${apiKey}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null; // 404 u otro => null
    const json = await res.json();
    const flat = fromFields(json?.fields || {});
    if (flat && typeof flat === "object") {
      // Acepta { dict: {...} } o plano
      const maybeDict = (flat.dict && typeof flat.dict === "object") ? flat.dict : flat;
      return maybeDict as Record<string, any>;
    }
    return {};
  } catch {
    return null;
  }
}

// --- ADD: loader de seeds por cliente (app/[locale]/<cliente>/i18n) ---
import { toShortLocale } from "@/app/lib/i18n/locale"; // si ya existía, reutilízalo

async function loadTenantSeed(locale: string, tenant?: string): Promise<Record<string,string>> {
  const short = toShortLocale(locale);
  const t = (tenant || "").toLowerCase();
  if (!t) return {};
  try {
    // Incluye todos los i18n locales de clientes en el bundle:
    const mod = await import(
      /* webpackInclude: /app\/\[locale\]\/[^/]+\/i18n\/index\.(ts|js)$/ */
      `@/app/[locale]/${t}/i18n`
    );
    const dicts = (mod.default ?? mod) as Record<string, Record<string,string>>;
    return dicts[short] ?? {};
  } catch {
    return {};
  }
}

// --- REPLACE: función efectiva (FS > seeds del cliente) ---
export async function getI18nEffectiveServer(locale: string, tenant?: string) {
  // 1) Seeds locales del cliente (carpeta bajo [locale])
  const seeds = await loadTenantSeed(locale, tenant);

  // 2) Firestore (tu código existente para traer el diccionario desde FS)
  //    Mantén tu lógica actual (colección, projectId/apiKey, shortId/longId, fetchDocREST, etc.)
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey    = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const I18N_COLL = process.env.NEXT_PUBLIC_I18N_COLL || "i18n_global";
  if (!projectId || !apiKey || !locale) return seeds;

  const shortId = (locale.split("-")[0] || "").trim();
  const longId  = locale;

  // NOTE: asume que ya tienes una función fetchDocREST(projectId, apiKey, coll, docId)
  let fsDoc: Record<string,string> = {};
  if (shortId) fsDoc = (await fetchDocREST(projectId, apiKey, I18N_COLL, shortId)) || {};
  if (!Object.keys(fsDoc).length) {
    fsDoc = (await fetchDocREST(projectId, apiKey, I18N_COLL, longId)) || {};
  }

  // 3) Prioridad RDD: FS pisa seeds del cliente
  return { ...seeds, ...fsDoc };
}
