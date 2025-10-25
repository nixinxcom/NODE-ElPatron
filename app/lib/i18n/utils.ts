export const DEFAULT_LOCALES = ["es", "en", "fr"];

export function normalizeRouteKey(input: string): string {
  let k = (input || "").trim().toLowerCase();
  if (!k || k === "/" || k === "index" || k === "home") return "home";
  k = k.replace(/^\/+/, "").replace(/\/+$/, "");
  k = k.replace(/^app\//, "");
  k = k.replace(/[()]/g, "");
  k = k.replace(/\//g, "-");
  return k;
}

export type TrafficLight = "red" | "yellow" | "green";

export function fmStatus(id: string, val?: string | null): TrafficLight {
  if (val == null || val === "") return "yellow";     // nulo/vacío
  if (val.trim() === id.trim()) return "red";         // valor == id
  return "green";                                     // valor definido
}
