// app/lib/styles/client.ts
"use client";

import { doc, getDoc, setDoc } from "firebase/firestore";
import { FbDB, ensureAnon, FbAuth } from "@/app/lib/services/firebase";
import type { StylesDoc } from "./types";
// Usa el resolvedor común para obtener un StylesDoc uniforme desde el seed TS
import { stylesSeedDoc as STYLES_SEED } from "@/app/lib/styles/styles";

// ---------- Config ----------
const STYLES_COLL = process.env.NEXT_PUBLIC_STYLES_COLL || "styles";
const STYLES_DOC  = process.env.NEXT_PUBLIC_STYLES_DOC  || "default";
const STYLES_REF  = doc(FbDB, STYLES_COLL, STYLES_DOC);

// ---------- Utils ----------
const isObj = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const isArr = Array.isArray;

/** Profundo con preferencia por FS (b gana; arrays reemplazan) */
function mergePreferFS(a: any, b: any): any {
  if (b === undefined) return a;
  if (a === undefined) return b;
  if (isArr(a) && isArr(b)) return b.slice();
  if (isObj(a) && isObj(b)) {
    const out: any = { ...a };
    for (const k of Object.keys(b)) out[k] = mergePreferFS((a as any)[k], (b as any)[k]);
    return out;
  }
  return b;
}

// ---------- Seed base (TSX → StylesDoc) ----------
const SEED_BASE: StylesDoc = (STYLES_SEED ?? {}) as StylesDoc;

// ---------- API (Client) ----------
/**
 * Lee el documento efectivo de estilos aplicando la RDD:
 *   Efectivo = (TSX) → FS   (FS > TSX)
 */
export async function loadStylesClient(): Promise<StylesDoc> {
  try {
    const snap = await getDoc(STYLES_REF);
    if (snap.exists()) {
      const fsDoc = snap.data() as StylesDoc;
      return mergePreferFS(SEED_BASE, fsDoc) as StylesDoc;
    }
  } catch {
    // noop → devolvemos seed si FS no está disponible
  }
  return SEED_BASE;
}

/**
 * Guarda el documento completo de estilos en FS.
 * - Usa sesión anónima si es necesario.
 * - Escribe con merge:false para mantener un solo source of truth.
 */
export async function saveStylesClient(docIn: StylesDoc): Promise<StylesDoc> {
  await ensureAnon(); // o usuario logueado; este helper garantiza auth
  const out: StylesDoc = {
    ...docIn,
    updatedAt: Date.now(),
    updatedBy: FbAuth?.currentUser?.uid,
  };
  await setDoc(STYLES_REF, out, { merge: false });
  return out;
}

// Helpers opcionales
export function getStylesDocPath(): string {
  return `${STYLES_COLL}/${STYLES_DOC}`;
}

// Debug opcional (puedes quitar)
export const __stylesSeedBase = SEED_BASE;
