

/* ─────────────────────────────────────────────────────────
DOC: SliderCardComp (JSX) — complements/components/SliderComp/SliderCardComp.jsx
QUÉ HACE:
  Tarjetas para slider (versión JS). Recibe datos y renderiza imagen + texto con estilos responsivos.

API / EXPORTS / RUTA:
  — export default function SliderCardComp(props): JSX.Element
    • props: { image, title, subtitle, href, className }

USO (ejemplo completo):
  import SliderCardComp from "@/complements/components/SliderComp/SliderCardComp.jsx";
  <SliderCardComp image="/e1.jpg" title="Noche Latina" href="/eventos" />

NOTAS CLAVE:
  — Migrable a TSX si se requiere tipado fuerte.
  — Alinear tamaños del contenedor del slider para evitar CLS.

DEPENDENCIAS:
  React · (opcional) Next/Image
────────────────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────────────
DOC: USO — complements/components/SliderComp/SliderCardComp.jsx
  import SliderCardComp from "@/complements/components/SliderComp/SliderCardComp.jsx";

  export default function SliderJS() {
    return (
      <div className="grid gap-4">
        <SliderCardComp
          image="/e1.jpg"       // string | requerido
          title="Noche Latina"  // string | requerido
          subtitle="Viernes"    // string | opcional
          href="/eventos/1"     // string | opcional
          className="rounded-lg"
        />
      </div>
    );
  }
────────────────────────────────────────────────────────── */
