"use client";
import Link from "next/link";
import { FormattedMessage, useIntl } from "react-intl";
import FM from "@/complements/i18n/FM";

export default function OfflinePage() {
  return (
    <main className="min-h-dvh flex items-center justify-center p-6 text-center">
      <div>
        <h1 className="text-2xl font-semibold mb-2">
          <FM id="offline.title" defaultMessage="Estás sin conexión" />
        </h1>
        <p className="mb-6 opacity-80">
          <FM id="offline.description" defaultMessage="Algunas funciones requieren internet. Intenta de nuevo cuando tengas señal." />
        </p>
        <div className="flex items-center gap-3 justify-center">
          <button onClick={() => location.reload()} className="px-4 py-2 rounded-md bg-black text-white">
            <FM id="offline.retry" defaultMessage="Reintentar" />
          </button>
          <Link href="/menus" className="px-4 py-2 rounded-md border">
            <FM id="offline.menu" defaultMessage="Ver menú" />
          </Link>
        </div>
      </div>
    </main>
  );
}

/* ─────────────────────────────────────────────────────────
DOC: Offline Page (global) — app/offline/page.tsx
QUÉ HACE:
  Página de respaldo cuando no hay conexión a Internet a nivel global (sin segmento [locale]).
  El Service Worker (SW) debería redirigir aquí cuando un fetch de documento falla y no existe
  caché disponible. Debe ser muy ligera y estática para garantizar su disponibilidad.

RUTA RESULTANTE:
  /offline   — aplica para toda la app (sin depender de /[locale])

API / PROPS QUE NEXT INYECTA:
type Props = {
  searchParams?: {
    from?: string           // opcional — URL original que intentó cargar, URL-encoded
    retry?: '1' | '0'       // opcional — flag para mostrar/ocultar botón de reintento
    lang?: 'es'|'en'|'fr'   // opcional — si quieres forzar idioma en esta página global
  }
}
export default function Page(props: Props): JSX.Element

USO (conceptual con Service Worker):
  — Precacha /offline y assets críticos (íconos, fuentes) durante la instalación del SW.
  — En la estrategia de fetch para navegación HTML:
      * NetworkFirst con timeout → si falla: responder con '/offline?from=<path-encoded>'
  — UI sugerida:
      * H1 claro (p. ej. “Estás sin conexión”)
      * Mensaje breve con la ruta original (decodifica searchParams.from de forma segura)
      * Botón “Reintentar” que hace location.reload() (implementa en un componente cliente)
      * Enlaces a secciones probablemente en caché (inicio, menús)

EJEMPLOS DE ACCESO:
  /offline?from=%2Fes%2Fmenus
  /offline?from=%2Fen%2Freservas&retry=1

NOTAS:
  — Este archivo es Server Component por defecto; evita Web APIs aquí.
  — Si necesitas detectar navigator.onLine o escuchar eventos 'online'/'offline',
    crea un pequeño child con "use client" que solo manipule la UI.
  — SEO: marca noindex desde metadata si la página es solo de contingencia.
  — Rendimiento: sin imágenes pesadas; tipografías del sistema preferidas o fuentes ya precacheadas.
  — i18n: como es global, puedes:
      * A) Mostrar mensajes neutrales ("Offline") o
      * B) Leer ?lang y mapear textos básicos según el valor.
  — Sugerencia de caché: export const dynamic = 'force-static' y/o revalidate = false para SSG puro.

DEPENDENCIAS:
  — Next.js App Router (searchParams)
  — Tu Service Worker (Workbox o propio) para enrutar el fallback a /offline
────────────────────────────────────────────────────────── */
