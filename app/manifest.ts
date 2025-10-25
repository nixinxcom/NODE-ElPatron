// app/manifest.ts
import type { MetadataRoute } from "next";
import { getSettingsEffective } from "@/complements/data/settingsFS";
import { getStylesEffective } from "@/complements/data/stylesFS";

// Unions válidos según Web App Manifest
type DisplayMode = "fullscreen" | "standalone" | "minimal-ui" | "browser";
type DisplayOverride = DisplayMode | "window-controls-overlay";
type Orientation =
  | "any" | "natural" | "landscape" | "portrait"
  | "portrait-primary" | "portrait-secondary"
  | "landscape-primary" | "landscape-secondary";
type IconPurpose = "any" | "maskable" | "monochrome";

// Listas para narrowing
const DISPLAY = ["fullscreen", "standalone", "minimal-ui", "browser"] as const;
const DISPLAY_OVERRIDE = [...DISPLAY, "window-controls-overlay"] as const;
const ORIENTATIONS = [
  "any","natural","landscape","portrait",
  "portrait-primary","portrait-secondary",
  "landscape-primary","landscape-secondary",
] as const;
const PURPOSES = ["any","maskable","monochrome"] as const;

// Guards/utilidades simples
const isOneOf = <A extends readonly string[]>(
  arr: A, v: unknown
): v is A[number] => typeof v === "string" && (arr as readonly string[]).includes(v as string);

const asArray = <T = any>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

// helpers para leer rutas anidadas con tolerancia
function pick<T = any>(obj: any, path: string[]): T | undefined {
  let cur = obj;
  for (const k of path) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = cur[k];
  }
  return cur as T | undefined;
}

function firstColor(theme: any, candidates: string[][]): string | undefined {
  for (const path of candidates) {
    const v = pick<string>(theme, path);
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  // 1) Regla de datos: FS > JSON > TSX
  const [settings, styles] = await Promise.all([
    getSettingsEffective(),
    getStylesEffective(),
  ]);

  const website = (settings as any).website ?? {};
  const pwa = (settings as any).pwa ?? {};

  // 2) Locale base (ej. "es" de "es-MX")
  const defLocale: string = website?.i18n?.defaultLocale?.split("-")?.[0] ?? "en";

  // 3) Config PWA con guards
  const display: DisplayMode = isOneOf(DISPLAY, pwa.display) ? pwa.display : "standalone";
  const display_override: DisplayOverride[] | undefined = Array.isArray(pwa.displayOverride)
    ? (pwa.displayOverride.filter((x: unknown) => isOneOf(DISPLAY_OVERRIDE, x)) as DisplayOverride[])
    : undefined;
  const orientation: Orientation | undefined = isOneOf(ORIENTATIONS, pwa.orientation) ? pwa.orientation : undefined;

  // 4) Tema efectivo para el MANIFEST (un solo color):
  //    Tomamos el slot inicial de settings y resolvemos a tema físico via aliases.
  const slot: "light" | "dark" =
    website?.theme?.initialSlot === "dark" ? "dark" : "light";

  const aliasName: string =
    String(website?.theme?.aliases?.[slot] ?? slot);

  const themeObj = (styles as any)?.themes?.[aliasName];

  // 5) Colores
  //    - theme_color: si hay override en settings.website.theme.meta.themeColor.light, lo respetamos;
  //                   si no, intentamos sacar un "primary" o similar del tema.
  //    - background_color: SIEMPRE sale de styles (del tema físico); si no hay, cae al theme_color.
  const themeColorOverride =
    website?.theme?.meta?.themeColor?.light as string | undefined;

  const derivedThemeColor =
    firstColor(themeObj, [
      ["colors", "primary"],
      ["tokens", "colors", "primary"],
      ["brand", "primary"],
      ["palette", "primary"],
      ["primary"],
    ]) ??
    firstColor(themeObj, [
      ["colors", "cta"],
      ["brand", "color"],
      ["accent"],
    ]);

  const derivedBackground =
    firstColor(themeObj, [
      ["colors", "background"],
      ["tokens", "colors", "background"],
      ["surface", "background"],
      ["palette", "background"],
      ["layer", "background"],
      ["base", "background"],
      ["background"],
      ["page", "background"],
    ]) ?? derivedThemeColor;

  const theme_color = themeColorOverride ?? derivedThemeColor ?? "#ffffff";
  const background_color = derivedBackground ?? theme_color;

  // 6) Manifest final
  return {
    name: pwa.name ?? website?.company?.name ?? "App",
    short_name: pwa.shortName ?? pwa.name ?? "App",
    description: pwa.description ?? "",

    start_url: pwa.startUrl ?? `/${defLocale}`,
    scope: pwa.scope ?? "/",
    id: pwa.id ?? `/${defLocale}`,
    display,
    display_override,
    orientation,

    icons: asArray<any>(pwa.icons).map((i) => ({
      src: i.src,
      sizes: i.sizes,
      type: i.type,
      purpose: isOneOf(PURPOSES, (i as any).purpose) ? ((i as any).purpose as IconPurpose) : undefined,
    })),

    screenshots: asArray<any>(pwa.screenshots).map((s) => ({
      src: s.src,
      sizes: s.sizes,
      type: s.type,
      label: s.label,
      form_factor: (s as any).form_factor as "wide" | "narrow" | undefined,
    })),

    theme_color,
    background_color,
  };
}
