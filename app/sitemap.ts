import type { MetadataRoute } from 'next';
import { siteOrigin } from '@/app/lib/site';

const LOCALES = ['es','en','fr'] as const;
type L = typeof LOCALES[number];
const DEFAULT: L = 'es';
const SITE_URL = siteOrigin();

const I18N_PAGES = ['/', '/menus', '/reservas', '/galeria', '/sobrenosotros', '/land', '/testings', '/encuesta'];
const SINGLE: Partial<Record<L,string[]>> = {
  es: ['/landingesp'],
  en: ['/landingeng'],
  fr: ['/landingfra'],
};

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const i18n = I18N_PAGES.map((path) => {
    const normalized = path === '/' ? '' : path;
    const byLocale = Object.fromEntries(LOCALES.map(l => [l, `${SITE_URL}/${l}${normalized}`]));
    const canonical = byLocale[DEFAULT];
    return {
      url: canonical,
      lastModified: now,
      alternates: { languages: { ...byLocale, 'x-default': canonical } },
    };
  });

  const single = LOCALES.flatMap((l) =>
    (SINGLE[l] ?? []).map((path) => ({ url: `${SITE_URL}/${l}${path}`, lastModified: now }))
  );

  return [...i18n, ...single];
}

/* ─────────────────────────────────────────────────────────
DOC: Metadata Route — Sitemap.xml — app/sitemap.ts
QUÉ HACE:
  Genera la(s) URL(s) del sitemap (o índice de sitemaps) usando la API de Metadata Routes de Next.js.
  Devuelve entradas con loc, lastModified, changeFrequency, priority y alternates (hreflang) para i18n.
  Se sirve en /sitemap.xml de forma estática en build (o dinámica si esta función hace fetch).

API / EXPORTS / RUTA:
  — export default function sitemap(): MetadataRoute.Sitemap | Promise<MetadataRoute.Sitemap>
      Devuelve un array de objetos:
        {
          url: string,                         // requerido | URL absoluta (https)
          lastModified?: string | Date,        // opcional  | ISO8601/Date | default: fecha de build
          changeFrequency?: "always"|"hourly"|"daily"|"weekly"|"monthly"|"yearly"|"never" // opcional
          priority?: number,                   // opcional  | 0.0..1.0
          alternates?: { languages?: Record<string, string> } // opcional | hreflang -> URL
        }
  — Ruta resultante:
      /sitemap.xml  (única para todo el sitio; no cambia por subpaths)

USO (ejemplo completo):
  // Tipo | opcional | valores permitidos | default (comentado)
  import type { MetadataRoute } from "next";
  import { BASE_URL, LOCALES, ROUTES } from "@/app/lib/site";

  export default function sitemap(): MetadataRoute.Sitemap {
    const last = new Date(); // Date | opcional | ISO/Date | build time
    // Rutas base por idioma
    const baseEntries = [
      { path: ROUTES.home,        priority: 1.0,  changeFrequency: "weekly"  },
      { path: ROUTES.menus,       priority: 0.8,  changeFrequency: "monthly" },
      { path: ROUTES.reservas,    priority: 0.9,  changeFrequency: "weekly"  },
      { path: ROUTES.eventos,     priority: 0.7,  changeFrequency: "daily"   },
      { path: ROUTES.galeria,     priority: 0.6,  changeFrequency: "monthly" }
    ];

    // Helper para componer URL absoluta
    const abs = (locale: string, p: string) => `${BASE_URL}/${locale}${p === "/" ? "" : p}`;

    // Construir alternates (hreflang) por ruta
    const buildAlternates = (p: string) => ({
      languages: Object.fromEntries(
        LOCALES.map(lc => [`${lc}-CA`, abs(lc, p)])
      )
    });

    // Expandir por cada locale
    const entries = baseEntries.flatMap(({ path, priority, changeFrequency }) =>
      LOCALES.map(locale => ({
        url: abs(locale, path),                            // string | requerido | URL abs
        lastModified: last,                                // Date | opcional
        changeFrequency,                                   // enum | opcional
        priority,                                          // number | opcional | 0..1
        alternates: buildAlternates(path)                  // hreflang | opcional
      }))
    );

    return entries;
  }

NOTAS CLAVE:
  — SSR/estático: por defecto Next genera el archivo de forma estática; si haces fetch aquí, el sitemap será dinámico.
  — i18n: usa alternates.languages para publicar hreflang (ej. "es-CA","en-CA","fr-CA") con URLs absolutas.
  — Canonicalidad: BASE_URL debe ser https y sin slash final; las rutas deben existir realmente en la app.
  — Rendimiento: evita hacer fetch pesado; si necesitas datos (p. ej., eventos), considera un caché y limitar a las URLs principales.
  — SEO: no incluyas rutas marcadas “noindex” (CloudQueries, mailmarketing, suscritos, desuscritos, pdf).
  — Prioridad/frecuencia: orientativas para crawlers; mantén consistencia (home más alta, páginas estáticas menos frecuentes).
  — Entornos: en preview/staging, ajusta BASE_URL (o genera sitemap vacío) para no indexar entornos no canónicos.

DEPENDENCIAS:
  next (MetadataRoute) · "@/app/lib/site" (BASE_URL, LOCALES, ROUTES)
────────────────────────────────────────────────────────── */
