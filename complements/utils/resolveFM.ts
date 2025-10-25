// complements/utils/resolveFM.ts
import React from 'react';

/**
 * Convierte cualquier árbol que puede contener <FM id defaultMessage />
 * en un árbol de strings usando el diccionario dado.
 */
export function stringifyBrandingWithDict<T = any>(
  node: any,
  dict: Record<string, string>
): T {
  const walk = (n: any): any => {
    if (Array.isArray(n)) return n.map(walk);
    if (React.isValidElement(n as any)) {
      const props = (n as any).props || {};
      const id = props.id as string | undefined;
      const def = props.defaultMessage as string | undefined;
      return id && dict[id] !== undefined ? dict[id] : (def ?? '');
    }
    if (n && typeof n === 'object') {
      const out: any = {};
      for (const k of Object.keys(n)) out[k] = walk(n[k]);
      return out;
    }
    return n;
  };
  return walk(node) as T;
}

/** Alias semántico: resolver FM a strings con diccionario */
export function resolveFMToStrings<S, D = any>(
  node: any,
  dict: Record<string, string>
): D {
  return stringifyBrandingWithDict<D>(node, dict);
}
