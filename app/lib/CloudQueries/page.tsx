import type { Metadata } from "next";
import { buildMetadata } from "@/app/lib/seo/meta";
import { pageMeta } from "@/app/lib/seo/pages";
import CloudQueriesPage  from "./CloudQueriesPage"
import { Suspense } from "react";

// ⬇ Esto le da metadata a la home usando la config central
export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata(pageMeta.home);
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CloudQueriesPage  />
    </Suspense>
  );
}

/* ─────────────────────────────────────────────────────────
DOC: CloudQueries — app/lib/CloudQueries/page.tsx
QUÉ HACE:
  Page del App Router que expone la herramienta de consultas a Firestore.
  Renderiza el componente cliente <CloudQueriesPage /> (UI para fechas, colección y tabla de resultados).

API / EXPORTS / RUTA:
  — export default function Page(): JSX.Element
  — params: (no usa)
  — searchParams: (no usa; cualquier query string es ignorada por esta page)
  — Ruta resultante:
      /lib/CloudQueries
      Si i18n por subpaths está activo: /{locale}/lib/CloudQueries (p. ej. /es/lib/CloudQueries)
  — Navegación de ejemplo:
      /lib/CloudQueries
      /lib/CloudQueries?coleccion=Customer%20Experience&start=20240101&end=20240131  // se ignoran

USO (ejemplo completo):
  // Enlaces desde otra vista del App Router (ejemplo)
  // Tipo | opcional | valores permitidos | default
  // <Link href="/lib/CloudQueries">Abrir consultas</Link>

  // Dentro de la propia page, el render es simple:
  // return (<CloudQueriesPage />);

NOTAS CLAVE:
  — SSR/CSR: este archivo es Server Component por defecto; delega toda la interacción a <CloudQueriesPage /> (Client Component).
  — SEO: es una herramienta interna; considerar no indexarla (robots noindex) si el proyecto expone sitemap/descubrimiento público.
  — i18n: la UI de <CloudQueriesPage /> usa react-intl (ids cloudq.*); esta page no define locale propia.
  — Seguridad: restringir acceso (middleware/auth) para evitar exposición de colecciones; reforzar reglas de Firestore.
  — Rendimiento: la carga de datos ocurre en cliente; si crece el volumen, evaluar paginación o mover la consulta a una API Route.
  — Idempotencia: re-render de la page no dispara consultas; la consulta depende de la interacción en el cliente.
  — Tracking: si se desea medir uso, agregar eventos (p. ej., botón “Consultar”) en el componente cliente.

DEPENDENCIAS:
  Next.js (App Router) · React
  ./CloudQueriesPage (componente cliente que implementa la lógica de consulta y renderizado)
────────────────────────────────────────────────────────── */
