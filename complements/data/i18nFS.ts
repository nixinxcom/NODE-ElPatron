// complements/data/i18nFS.ts
import { doc, getDoc, setDoc } from "firebase/firestore";
import { FbDB } from "@/app/lib/services/firebase";
import seedDicts from "@/seeds/i18n"; // { "es": {...}, "en": {...}, "fr": {...} }

export type I18nDict = Record<string, string>;

const I18N_COLL = process.env.NEXT_PUBLIC_I18N_COLL || "i18n_global";

function baseLang(locale: string) {
  const i = locale.indexOf("-");
  return i > 0 ? locale.slice(0, i) : locale;
}

function flatten(obj: any, pfx = "", out: I18nDict = {}): I18nDict {
  if (!obj) return out;
  for (const [k, v] of Object.entries(obj)) {
    const key = pfx ? `${pfx}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) flatten(v, key, out);
    else out[key] = String(v ?? "");
  }
  return out;
}

export async function getI18nEffective(locale: string): Promise<I18nDict> {
  const lang = baseLang(locale);

  // 1) FS (siempre doc corto)
  const fsShort = await getDoc(doc(FbDB, I18N_COLL, lang)).then((s) =>
    s.exists() ? flatten(s.data()) : {}
  );

  // 2) Seeds (sólo corto)
  const seedShort = (seedDicts as any)[lang] ?? {};

  // 3) FS pisa seeds
  return { ...seedShort, ...fsShort };
}

export async function saveI18n(locale: string, dict: I18nDict) {
  const lang = baseLang(locale); // guardar siempre en corto
  await setDoc(doc(FbDB, I18N_COLL, lang), dict, { merge: true });
}
