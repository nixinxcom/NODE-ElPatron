// app/lib/seo/defaults.ts
// Defaults SEO neutrales del proyecto. Útiles como base editorial y
// para mezclarlos en el layout de (sites) cuando Firestore esté vacío.

export const SEO_DEFAULTS = {
  siteName: "Your Brand",
  baseUrl: "https://www.example.com",
  defaultOgImage: "https://example.com/assets/og-default.jpg",
} as const;

/** Metadatos recomendados de alcance GLOBAL (no específicos de página) */
export const DEFAULT_META_GLOBAL: Record<string, string> = {
  "twitter:card": "summary_large_image",
};

/** Metadatos recomendados de alcance SITE */
export const DEFAULT_META_SITE: Record<string, string> = {
  "og:type": "website",
};

// 💡 Opcional (si quieres usarlos ya):
// En app/lib/seo/withPageMetadata.ts, dentro de withSitesLayoutMetadata(),
// puedes mezclar:
// return metaRecordToNext({
//   ...DEFAULT_META_GLOBAL,
//   ...DEFAULT_META_SITE,
//   ...(g || {}), ...(s || {}),
// });
