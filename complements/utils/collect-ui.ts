// Recolecta todos los UIStrings/FMs de un árbol arbitrario y devuelve un diccionario plano.
// Un UIString/FFormattedMessage es reconocido por tener props.id y (opcional) props.defaultMessage.
export type UIStringLike = {
  props?: {
    id?: string;
    defaultMessage?: string;
    [k: string]: any;
  };
  [k: string]: any;
};

export type StringDict = Record<string, string>;

export function collectUIStrings(root: any, nsPrefix?: string): StringDict {
  const out: StringDict = {};
  const seen = new Set<string>();

  const push = (id: string, def?: string) => {
    const key = nsPrefix && !id.startsWith(nsPrefix + '.') ? `${nsPrefix}.${id}` : id;
    if (!seen.has(key)) {
      seen.add(key);
      out[key] = typeof def === 'string' ? def : '';
    }
  };

  const walk = (node: any) => {
    if (!node) return;

    // FM/UIString detectado
    if (typeof node === 'object' && node.props && node.props.id) {
      push(String(node.props.id), node.props.defaultMessage);
      return;
    }

    if (Array.isArray(node)) {
      for (const it of node) walk(it);
      return;
    }

    if (typeof node === 'object') {
      for (const k of Object.keys(node)) walk(node[k]);
    }
  };

  walk(root);
  return out;
}
