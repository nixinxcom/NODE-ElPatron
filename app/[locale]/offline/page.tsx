import React from 'react'; import OriginalPage from '../../offline/page';
type L='es'|'en'|'fr'; export default async function Wrapped(props:any){
  const mp=props?.params; const p=mp&&typeof mp?.then==='function'?await mp:mp;
  const locale:L=(p?.locale??'es') as L;
  return <OriginalPage {...props} params={{...p,locale}} locale={locale}/>;
}

/* ─────────────────────────────────────────────────────────
DOC: Offline Page (app/\[locale]/offline/page.tsx)
QUÉ HACE:
Página de respaldo cuando el usuario no tiene conexión. Muestra un mensaje sencillo,
enlaces útiles (inicio, menú, reservas) y opciones para reintentar. Pensada para PWA:
el Service Worker redirige a esta ruta cuando un fetch falla sin caché disponible.

RUTAS RESULTANTES:
/es/offline   /en/offline   /fr/offline   — bajo el segmento \[locale]

API / PROPS QUE NEXT INYECTA:
type Props = {
params?: { locale?: 'es' | 'en' | 'fr' }          // opcional — locale activo
searchParams?: {
from?: string                                   // opcional — ruta original donde falló la carga
retry?: '1' | '0'                               // opcional — indica si se mostró botón de reintento
ref?: string                                    // opcional — fuente interna
utm\_source?: string                             // opcional — tracking UTM
utm\_medium?: string                             // opcional — tracking UTM
utm\_campaign?: string                           // opcional — tracking UTM
}
}
export default function Page(props: Props): JSX.Element

USO (conceptual):
— Esta page suele ser estática y liviana para que el SW la tenga siempre en caché.
— El Service Worker intercepta requests y, si está offline y no hay match en caché,
responde con /\[locale]/offline agregando from con la URL original.
— En la UI, ofrece:
(1) botón "Reintentar" que recarga la página
(2) enlaces a secciones que probablemente estén precacheadas (home, menús)
(3) estado de conectividad básico si se usa un wrapper cliente

INTEGRACIÓN PWA (resumen):
— Precarga esta ruta en el manifest de precache del SW para todos los locales.
— Precacha también íconos, fuentes críticas y una o dos páginas clave (home, menús).
— En la estrategia de fetch, usa:
documentos HTML → NetworkFirst con fallback a /offline
assets estáticos → StaleWhileRevalidate o CacheFirst
— Mantén esta página sin dependencias pesadas ni llamadas externas.

EJEMPLOS DE ACCESO (solo ilustrativos):
/es/offline?from=%2Fes%2Fmenus
/en/offline?from=%2Fen%2Freservas\&retry=1

NOTAS:
— Es Server Component por defecto; si deseas detectar navigator.onLine o escuchar 'online' y 'offline',
crea un pequeño componente hijo con "use client" para esa UX opcional.
— SEO: suele marcarse noindex en metadata de la página o layout de la sección.
— Accesibilidad: un H1 claro, descripción breve y enlaces de navegación con aria-label.
— Rendimiento: evita imágenes grandes; usa un ícono ligero o solo texto.
— i18n: todos los textos deben respetar params.locale o tu sistema de mensajes.

DEPENDENCIAS:
— Next.js App Router (params, searchParams)
— Service Worker propio o librería PWA (opcional) para manejar el fallback offline
────────────────────────────────────────────────────────── */
