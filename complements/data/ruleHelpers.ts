// complements/data/ruleHelpers.ts
type LayerTag = "tsx_plain" | "json" | "tsx_fm" | "fs";

export function isFMElement(x: any): x is { props: any; type: any } {
  // Basta con que sea un ReactElement con id y defaultMessage; no confiamos en el nombre del componente
  return !!(
    x &&
    typeof x === "object" &&
    x.props &&
    typeof x.props.id === "string" &&
    ("defaultMessage" in (x.props || {}))
  );
}

export function splitFM(doc: any): { tsxFmOnly: any; tsxNoFm: any } {
  if (isFMElement(doc)) return { tsxFmOnly: doc, tsxNoFm: undefined };
  if (Array.isArray(doc)) {
    const fmArr: any[] = []; const noArr: any[] = [];
    let hasFm = false, hasNo = false;
    for (const item of doc) {
      const { tsxFmOnly, tsxNoFm } = splitFM(item);
      fmArr.push(tsxFmOnly); noArr.push(tsxNoFm);
      if (tsxFmOnly !== undefined) hasFm = true;
      if (tsxNoFm !== undefined) hasNo = true;
    }
    return { tsxFmOnly: hasFm ? fmArr : undefined, tsxNoFm: hasNo ? noArr : undefined };
  }
  if (doc && typeof doc === "object") {
    const fmObj: any = {}; const noObj: any = {};
    let hasFm = false, hasNo = false;
    for (const [k, v] of Object.entries(doc)) {
      const { tsxFmOnly, tsxNoFm } = splitFM(v);
      if (tsxFmOnly !== undefined) { fmObj[k] = tsxFmOnly; hasFm = true; }
      if (tsxNoFm !== undefined) { noObj[k] = tsxNoFm; hasNo = true; }
    }
    return { tsxFmOnly: hasFm ? fmObj : undefined, tsxNoFm: hasNo ? noObj : undefined };
  }
  return { tsxFmOnly: undefined, tsxNoFm: doc };
}

export function resolveFM(docWithFM: any, dict: Record<string, any>): any {
  if (docWithFM === undefined) return undefined;
  if (isFMElement(docWithFM)) {
    const id = docWithFM.props.id;
    const def = docWithFM.props.defaultMessage;
    return dict?.[id] ?? def ?? "";
  }
  if (Array.isArray(docWithFM)) return docWithFM.map((v) => resolveFM(v, dict));
  if (docWithFM && typeof docWithFM === "object") {
    const out: any = {};
    for (const [k, v] of Object.entries(docWithFM)) out[k] = resolveFM(v, dict);
    return out;
  }
  return docWithFM;
}

export function mergeWithProvenance(
  layers: Array<{ tag: LayerTag; obj: any }>
): { effective: any; provenance: any } {
  const eff: any = {}; const prov: any = {};
  const assign = (target: any, src: any, tag: LayerTag, curProv: any) => {
    if (src === undefined) return;
    if (Array.isArray(src) || typeof src !== "object" || src === null) {
      return { value: src, tag };
    }
    for (const [k, v] of Object.entries(src)) {
      if (Array.isArray(v) || typeof v !== "object" || v === null) {
        target[k] = v; curProv[k] = tag;
      } else {
        if (!target[k] || typeof target[k] !== "object") target[k] = {};
        if (!curProv[k] || typeof curProv[k] !== "object") curProv[k] = {};
        const res = assign(target[k], v, tag, curProv[k]);
        if (res) { target[k] = res.value; curProv[k] = res.tag; }
      }
    }
    return null;
  };
  for (const layer of layers) assign(eff, layer.obj, layer.tag, prov);
  return { effective: eff, provenance: prov };
}

export function pickSeedDict(seedDicts: any, locale: string): Record<string, any> {
  if (!seedDicts) return {};
  const loc  = (locale || '').toLowerCase();  // "fr-ca"
  const lang = loc.split('-')[0];             // "fr"
  return (seedDicts[loc] || seedDicts[lang] || seedDicts['en'] || {}) as Record<string, any>;
}
