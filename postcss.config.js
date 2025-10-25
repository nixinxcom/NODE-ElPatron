module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};


/* ─────────────────────────────────────────────────────────
DOC: Config PostCSS — postcss.config.js
QUÉ HACE:
  Configura la cadena de PostCSS (TailwindCSS y Autoprefixer).

API / EXPORTS / RUTA:
  — module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } }

USO (ejemplo completo):
  // Se usa automáticamente por Next al procesar CSS.

NOTAS CLAVE:
  — Asegurar presencia de tailwind.config.ts y @tailwind en globals.css.
  — Autoprefixer añade compatibilidad cross-browser.

DEPENDENCIAS:
  postcss · tailwindcss · autoprefixer
────────────────────────────────────────────────────────── */
