export const isObj = (v: any) => v && typeof v === 'object' && !Array.isArray(v);

/** Regla: objetos → merge recursivo; arrays → replace; primitivos → pisa */
export function deepMerge<T>(base: T, over?: Partial<T>): T {
  if (!over) return base;
  const out: any = Array.isArray(base) ? [...(base as any)] : { ...(base as any) };
  for (const k of Object.keys(over as any)) {
    const b = (base as any)[k];
    const o = (over as any)[k];
    out[k] = (isObj(b) && isObj(o)) ? deepMerge(b, o) : (Array.isArray(o) ? [...o] : o);
  }
  return out;
}
