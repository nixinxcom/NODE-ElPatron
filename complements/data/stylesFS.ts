// complements/data/stylesFS.ts
"use server";

import type { StylesSchema, StylesDocLoose } from "@/app/lib/styles/types";
import { normalizeStyles, deepMerge } from "@/app/lib/styles/types";

/** 1) SEED TSX (fallback final) */
import * as stylesSeedModule from "@/seeds/styles";
const seedFromTsx: StylesDocLoose =
  (stylesSeedModule as any)?.default ??
  (stylesSeedModule as any)?.stylesSeed ??
  (stylesSeedModule as any);

/** 2) Firestore / FS (máxima prioridad) */
async function readFromFS(): Promise<StylesDocLoose> {
  try {
    const { loadStylesGlobalServer } = await import("@/complements/data/stylesFS.server");
    return (await loadStylesGlobalServer()) ?? {};
  } catch {
    return {};
  }
}

/** API principal (efectivo) → prioridad FS > TSX (sin JSON) */
export async function getStylesEffective(): Promise<StylesSchema> {
  const [fsData] = await Promise.all([readFromFS()]);
  const tsxData = (seedFromTsx ?? {}) as StylesDocLoose;

  // merge de menor a mayor prioridad (TSX base → FS override)
  const mergedLoose = deepMerge(tsxData as any, fsData as any) as StylesDocLoose;

  // normalizamos a esquema completo tolerante a parciales
  return normalizeStyles(mergedLoose);
}

/** Para el editor (carga/guarda) */
export async function getStylesEditorSchema(): Promise<StylesSchema> {
  return getStylesEffective();
}

export async function saveStylesSchema(_schema: StylesSchema): Promise<void> {
  // Si quieres persistir server-side, implementa aquí con stylesFS.server.ts.
  // Actualmente la UI guarda en Firestore con Web SDK.
}
