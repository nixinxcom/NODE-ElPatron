// app/lib/adsense.tsx
'use client';
import { useEffect } from 'react';

//Valida si es ambiente de producción o desarrollo
const isProd = process.env.NODE_ENV === 'production';
let ADSENSE_LOADED = false;

export function EnsureAdsense() {
  useEffect(() => {
    // Consent “granted” SOLO en dev antes de cargar AdSense
    if (!isProd) {
      const w = window as any;
      w.dataLayer = w.dataLayer || [];
      const gtag = (...args: any[]) => w.dataLayer.push(args);
      gtag('consent', 'default', {
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted',
        analytics_storage: 'granted',
      });
    }

    if (ADSENSE_LOADED) return;

    // ¿ya existe el script?
    const existing = document.querySelector(
      'script[src^="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]'
    );
    if (existing) { ADSENSE_LOADED = true; return; }

    const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
    if (!client) { console.warn('[AdSense] Falta NEXT_PUBLIC_ADSENSE_CLIENT'); return; }

    const s = document.createElement('script');
    s.async = true;
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
    s.crossOrigin = 'anonymous';
    s.onload = () => { ADSENSE_LOADED = true; };
    document.head.appendChild(s);
  }, []);

  return null;
}

/* ─────────────────────────────────────────────────────────
DOC: Componente utilitario AdSense — app/lib/adsense.tsx
QUÉ HACE:
  Carga idempotente el script de Google AdSense en cliente y renderiza un <ins class="adsbygoogle">
  con las attributes necesarias (data-ad-client, data-ad-slot, data-ad-format, etc.). Tras montar
  el componente, ejecuta (window.adsbygoogle = window.adsbygoogle || []).push({}) para solicitar
  el relleno del anuncio. Pensado para App Router (Next.js) como Client Component.

API / EXPORTS / RUTA:
  — export default function AdSense(props: Props): JSX.Element
  — type Props = {
      client: string                   // requerido | "ca-pub-XXXXXXXXXXXXXXX" | —
      slot: string                     // requerido | id del bloque ("XXXXXXXXXX") | —
      format?: "auto" | "rectangle"    // opcional  | valores permitidos | default: "auto"
      responsive?: boolean             // opcional  | true/false | default: true
      layout?: string                  // opcional  | p.ej. "in-article" | default: undefined
      layoutKey?: string               // opcional  | p.ej. "-gw-3+1f-3d+2z" | default: undefined
      style?: React.CSSProperties      // opcional  | tamaño/flujo del contenedor | default: {}
      className?: string               // opcional  | clases adicionales | default: ""
    }
  — Carga de script: asíncrona, una sola vez por página (usa guardas para no duplicar etiqueta <script>).

USO (ejemplo completo):
  // Tipo | opcional | valores permitidos | default (comentado en cada prop)
  "use client";
  import AdSense from "@/app/lib/adsense";

  export default function Articulo() {
    return (
      <section>
        <p>Contenido del artículo…</p>
        <AdSense
          client="ca-pub-1234567890123456"    // string | requerido | "ca-pub-*" | —
          slot="9876543210"                   // string | requerido | id de bloque | —
          format="auto"                       // "auto"|"rectangle" | opcional | "auto"
          responsive={true}                   // boolean | opcional | true/false | true
          layout="in-article"                 // string | opcional | "in-article" | —
          layoutKey="-gw-3+1f-3d+2z"          // string | opcional | clave de layout | —
          style={{ display: "block", minHeight: 200 }} // CSS | opcional | — | {}
        />
        <p>Más contenido…</p>
      </section>
    );
  }

NOTAS CLAVE:
  — SSR/CSR: debe ejecutarse en cliente. Evita usarlo en Server Components; prefija el archivo o consumidor con "use client".
  — Idempotencia: incluir el script de AdSense solo una vez por documento. Usa una marca global (p. ej. window.__adsenseLoaded).
  — Política/Seguridad: cumplir políticas de AdSense (ubicación, densidad, contenido), consentimiento (CMP) y restricciones por región.
  — Rendimiento: el script de AdSense es pesado; considera lazy loading y tamaños de contenedor explícitos para evitar CLS.
  — SEO: los anuncios no deben bloquear contenido principal ni afectar Core Web Vitals.
  — i18n/Tracking: no añade UTM; el tracking lo gestiona Google Ads/AdSense. Evita manipular el DOM del anuncio.
  — Accesibilidad: provee tamaños/espaciados adecuados; no insertes anuncios dentro de <h1>/<h2> o elementos interactivos.

DEPENDENCIAS:
  React · Next.js (App Router) · (opcional) next/script para cargar el script con estrategia "afterInteractive"
────────────────────────────────────────────────────────── */
