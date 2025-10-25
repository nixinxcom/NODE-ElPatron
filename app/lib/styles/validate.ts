// app/lib/styles/validate.ts
// Shim de validación—conserva firma para la UI Admin.

import type { StylesDoc, TokenSet, StyleState } from "./types";

const STATES: StyleState[] = ["rest", "hover", "active", "disabled", "highlight"];

const isObj = (x: any): x is Record<string, any> =>
  !!x && typeof x === "object" && !Array.isArray(x);

const isTokenSet = (x: any): x is TokenSet => isObj(x); // validación laxa

/** Type guard rápido para no romper la UI */
export function isStylesDoc(x: any): x is StylesDoc {
  if (!isObj(x)) return false;
  if (x.$version !== 1) return false;
  if (!isObj(x.global) || !isObj(x.global.body)) return false;
  if (!isObj(x.components)) return false;
  // Chequeo superficial de alguna clave
  for (const comp of Object.keys(x.components)) {
    const byTheme = x.components[comp];
    if (!isObj(byTheme)) continue;
    for (const theme of Object.keys(byTheme)) {
      const byState = (byTheme as any)[theme];
      if (!isObj(byState)) continue;
      for (const st of STATES) {
        const t = byState[st];
        if (t != null && !isTokenSet(t)) return false;
      }
    }
  }
  return true;
}

/** Validador con mensajes si quieres mostrar errores en la UI */
export type ValidationResult = { ok: boolean; errors: string[] };

export function validateStylesDoc(x: any): ValidationResult {
  const errors: string[] = [];
  if (!isObj(x)) {
    errors.push("Styles debe ser un objeto.");
    return { ok: false, errors };
  }
  if (x.$version !== 1) errors.push('Falta "$version": 1');
  if (!isObj(x.global)) errors.push('Falta "global"');
  if (!isObj(x.global?.body)) errors.push('Falta "global.body"');
  if (!isObj(x.components)) errors.push('Falta "components"');

  // Chequeo ligero de estructura
  if (isObj(x.components)) {
    for (const comp of Object.keys(x.components)) {
      const byTheme = x.components[comp];
      if (!isObj(byTheme)) {
        errors.push(`components.${comp} debe ser objeto (theme → state → tokens)`);
        continue;
      }
      for (const theme of Object.keys(byTheme)) {
        const byState = (byTheme as any)[theme];
        if (!isObj(byState)) {
          errors.push(`components.${comp}.${theme} debe ser objeto (state → tokens)`);
          continue;
        }
        for (const st of STATES) {
          const t = byState[st];
          if (t != null && !isTokenSet(t)) {
            errors.push(`components.${comp}.${theme}.${st} debe ser TokenSet`);
          }
        }
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

// Alias por si tu código esperaba `validate`
export const validate = validateStylesDoc;
