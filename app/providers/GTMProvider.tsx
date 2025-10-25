"use client";
import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

declare global { interface Window { dataLayer: any[] } }

export default function GTMProvider({ children }: { children?: React.ReactNode }) {
  const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!GTM_ID || typeof window === "undefined") return;

    // Construye la URL de página
    const qs = searchParams?.toString();
    const page_path = (pathname || "/") + (qs ? `?${qs}` : "");

    // Evita duplicados en la misma ruta
    if (lastPathRef.current === page_path) return;
    lastPathRef.current = page_path;

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "page_view",
      page_path,
      page_location: window.location.href,
      page_title: document?.title || "",
    });
  }, [pathname, searchParams, GTM_ID]);

  return <>{children}</>;
}

/* ─────────────────────────────────────────────────────────
DOC: GTMProvider (app/providers/GTMProvider.tsx)
QUÉ HACE:
  Inyecta Google Tag Manager (GTM) y gestiona el dataLayer en el cliente:
  - Crea window[dataLayerName] si no existe y hace los primeros push().
  - Inserta el <script> de GTM (y <noscript> iframe si se solicita).
  - Opcional: establece Consent Mode, empuja eventos iniciales y expone un helper de push.
  NOTA: Si este componente usa efectos (window, document) debe iniciar con "use client".

PROPS (TypeScript sugerido; ajusta a tu implementación real):
export interface GTMProviderProps {
  id: string                                                // requerido  ID del contenedor GTM, ej. 'GTM-XXXXXXX'
  dataLayerName?: string                                    // opcional  nombre de la capa | default: 'dataLayer'
  initialDataLayer?: Record<string, any>                    // opcional  estado inicial (se empuja antes del script)
  initialEvent?: string | false                             // opcional  evento inicial | default: 'app_view' | false para no disparar
  events?: Array<Record<string, any>>                       // opcional  eventos adicionales a empujar tras montar
  consent?: Partial<Record<
    'ad_storage'|'analytics_storage'|'ad_user_data'|'ad_personalization',
    'granted'|'denied'
  >>                                                        // opcional  Consent Mode v2: estados por tipo
  enabled?: boolean                                         // opcional  habilita/deshabilita la carga | default: true
  noscript?: boolean                                        // opcional  renderiza <noscript> iframe | default: true
  auth?: string                                             // opcional  gtm_auth (ambientes de GTM)
  preview?: string                                          // opcional  gtm_preview (ambientes de GTM)
  cookiesWin?: 'x'|'w'                                      // opcional  gtm_cookies_win | default: 'x'
  strategy?: 'afterInteractive'|'lazyOnload'|'beforeInteractive' // opcional  Next Script strategy | default: 'afterInteractive'
  nonce?: string                                            // opcional  CSP nonce para el script inline
  debug?: boolean                                           // opcional  logs a consola | default: false
  onReady?: () => void                                      // opcional  callback al finalizar la carga básica
}

USO (ejemplo completo):
// import { GTMProvider } from './GTMProvider'

// <GTMProvider
//   id="GTM-XXXXXXX"                                  // requerido  string
//   dataLayerName="dataLayer"                         // opcional  string | default 'dataLayer'
//   initialDataLayer={{ page_path: '/es', locale: 'es' }} // opcional  Record<string,any>
//   initialEvent="app_view"                           // opcional  string|false | default 'app_view'
//   events={[                                         // opcional  Array<Record<string,any>>
//     { event: 'page_view', page_title: 'Inicio', page_location: 'https://tusitio.com/es' },
//     { event: 'cta_click', cta: 'Reservar', location: 'hero' }
//   ]}
//   consent={{                                        // opcional  Consent Mode v2
//     ad_storage: 'denied',                           // opcional  'granted'|'denied'
//     analytics_storage: 'granted'                    // opcional  'granted'|'denied'
//   }}
//   enabled={true}                                    // opcional  boolean | default true
//   noscript={true}                                   // opcional  boolean | default true
//   auth="AbCdEf"                                     // opcional  string (gtm_auth)
//   preview="env-3"                                   // opcional  string (gtm_preview)
//   cookiesWin="x"                                    // opcional  'x'|'w' | default 'x'
//   strategy="afterInteractive"                       // opcional  'afterInteractive'|'lazyOnload'|'beforeInteractive'
//   nonce=""                                          // opcional  string
//   debug={false}                                     // opcional  boolean | default false
//   onReady={() => { /* tracking propio sin cerrar este bloque de comentario / }} // opcional  función
// />

NOTAS DE IMPLEMENTACIÓN (recomendadas dentro del componente):
  1) dataLayer inicial:
     - Antes de cargar el script, define window[dataLayerName] = window[dataLayerName] || [].
     - Si initialDataLayer existe, haz push(initialDataLayer).
     - Si consent existe, empuja un evento/objeto de consentimiento de acuerdo con tu política.
     - Si initialEvent !== false, push({ event: initialEvent }).
  2) Carga del script:
     - Construye la URL base: https://www.googletagmanager.com/gtm.js?id=GTM-XXXXXXX
     - Anexa params de ambiente si auth/preview: &gtm_auth=...&gtm_preview=...&gtm_cookies_win=...
     - Inserta el <Script> de next/script con la strategy indicada (default afterInteractive).
  3) Noscript:
     - Si noscript=true, renderiza el iframe:
       https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX (con auth/preview si aplica)
     - Ubícalo lo más arriba dentro de <body> para mayor fidelidad.
  4) Empuje de eventos adicionales:
     - Tras montar, recorre props.events y haz push por cada uno.
     - Si debug, console.log de cada push con el dataLayerName usado.
  5) Helper global (opcional):
     - Exponer window.gtmPush = (obj) => window[dataLayerName].push(obj) para disparos posteriores.

BUENAS PRÁCTICAS / SEGURIDAD:
  - Cargar GTM una sola vez en toda la app (idealmente en el layout superior por locale).
  - No dupliques measurement (si usas GA4 via GTM, evita insertar el snippet directo de GA4 aparte).
  - Respeta el consentimiento del usuario (CASL/GDPR). No actives tags de ads si ad_storage='denied'.
  - Define un nonce si usas CSP estricta y asegúrate de aplicarlo al <Script> inline cuando corresponda.

SSR Y RUNTIME:
  - El marcado del script/iframe puede generarse en Server Components, pero cualquier lectura de window
    requiere "use client". Si tu GTMProvider hace push desde efectos, colócalo como Client Component.
  - En Next.js App Router, 'beforeInteractive' solo funciona en el root layout; en componentes regulares
    usa 'afterInteractive' o 'lazyOnload'.

DEPENDENCIAS:
  - next/script (recomendado para insertar el script con strategy y nonce).
  - Web APIs (window) si decides exponer helper y empujar eventos desde efectos.

CHECKLIST RÁPIDO:
  - Crear dataLayer si no existe (nombre configurable).
  - Empujar initialDataLayer, Consent Mode (si aplica) y initialEvent.
  - Cargar gtm.js con params de ambiente cuando existan.
  - Renderizar <noscript> si lo pides.
  - Exponer helper y procesar events[] tras montar.
────────────────────────────────────────────────────────── */
