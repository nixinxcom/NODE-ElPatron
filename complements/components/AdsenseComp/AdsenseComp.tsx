// complements/components/AdsenseComp/AdsenseComp.tsx
'use client';
import { CSSProperties, useEffect, useRef } from 'react';

const isProd = process.env.NODE_ENV === 'production';

function isLocalhost() {
  if (typeof window === 'undefined') return false;
  return /^(localhost|127\.0\.0\.1|::1)$/i.test(window.location.hostname);
}

const testMode =
  !isProd ||                      // dev
  isLocalhost() ||                // build prod pero corriendo en localhost
  process.env.NEXT_PUBLIC_ADSENSE_TEST === '1'; // palanca opcional


type Common = { adSlot: string; className?: string; style?: CSSProperties };
type Props =
  | (Common & { Type: { kind: 'display';    format: 'auto' | 'rectangle' | 'vertical' | 'horizontal'; fullWidthResponsive?: boolean } })
  | (Common & { Type: { kind: 'in-article'; align?: 'left' | 'center' | 'right' } })
  | (Common & { Type: { kind: 'multiplex' } })
  | (Common & { Type: { kind: 'in-feed';    layoutKey: string } });

const pushed = new WeakSet<Element>();
function pushOnce(ins?: Element | null) {
  if (!ins) return;
  if ((ins as HTMLElement).getAttribute('data-ad-status')) return;
  if (pushed.has(ins)) return;
  const w = window as any;
  (w.adsbygoogle = w.adsbygoogle || []).push({});
  pushed.add(ins);
}

export default function AdSense(props: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { pushOnce(ref.current?.querySelector('ins.adsbygoogle')); }, []);

  // base segura
  const baseIns: CSSProperties = { display: 'block', width: '100%' };
  let dataset: Record<string, string> = {};
  let insStyle: CSSProperties = baseIns;

  switch (props.Type.kind) {
    case 'display': {
      const { format, fullWidthResponsive = true } = props.Type;
      dataset = { 'data-ad-format': format, 'data-full-width-responsive': String(fullWidthResponsive) };
      insStyle = { ...baseIns, minHeight: 90, ...props.style };
      break;
    }
    case 'in-article': {
      const align = props.Type.align ?? 'center';
      dataset = { 'data-ad-layout': 'in-article', 'data-ad-format': 'fluid' };
      insStyle = { ...baseIns, minHeight: 200, textAlign: align, ...props.style };
      break;
    }
    case 'multiplex': {
      dataset = { 'data-ad-format': 'autorelaxed' };
      insStyle = { ...baseIns, minHeight: 260, ...props.style };
      break;
    }
    case 'in-feed': {
      const { layoutKey } = props.Type;
      dataset = { 'data-ad-format': 'fluid', 'data-ad-layout-key': layoutKey };
      insStyle = { ...baseIns, minHeight: 240, ...props.style };
      break;
    }
  }

  return (
    <div ref={ref} className={props.className ?? 'adsense-container'}>
      <ins
        className="adsbygoogle"
        style={insStyle}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT}
        data-ad-slot={props.adSlot}
        {...dataset}
        {...(!isProd ? ({ 'data-adtest': 'on' } as any) : {})}
        {...(testMode ? ({ 'data-adtest': 'on' } as any) : {})}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
DOC: AdSense Component — complements/components/AdsenseComp/AdsenseComp.tsx
QUÉ HACE:
  Client Component que inserta el script de Google AdSense (idempotente) y renderiza un bloque <ins class="adsbygoogle">.
  Tras montar, hace (window.adsbygoogle = window.adsbygoogle || []).push({}) para solicitar el anuncio.

API / EXPORTS / RUTA:
  — export interface AdsenseProps {
      client: string                               // requerido | "ca-pub-XXXXXXXXXXXX"
      slot: string                                 // requerido | id del bloque
      format?: "auto"|"rectangle"|"vertical"|"horizontal" // opcional | default: "auto"
      responsive?: boolean                         // opcional | default: true
      layout?: string                              // opcional | ej. "in-article"
      layoutKey?: string                           // opcional | ej. "-gw-3+1f-3d+2z"
      className?: string                           // opcional
      style?: React.CSSProperties                  // opcional | contenedor (reservar altura)
    }
  — export default function AdsenseComp(props: AdsenseProps): JSX.Element

USO (ejemplo completo):
  "use client";
  import AdsenseComp from "@/complements/components/AdsenseComp/AdsenseComp";
  <AdsenseComp client="ca-pub-123..." slot="9876543210" format="auto" responsive style={{display:"block",minHeight:250}} />

NOTAS CLAVE:
  — Solo cliente. No usar en Server Components.
  — Cargar el script una sola vez (usar marca global window.__adsenseLoaded).
  — Cumplir políticas AdSense (densidad, contenido, CMP). Evitar CLS reservando altura.
  — No dentro de <h1>/<button> ni elementos interactivos.

DEPENDENCIAS:
  window.adsbygoogle · (opcional) next/script
────────────────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────────────
DOC: USO (ejemplo completo) — complements/components/AdsenseComp/AdsenseComp.tsx
  "use client";
  import AdsenseComp from "@/complements/components/AdsenseComp/AdsenseComp";

  export default function ArticleWithAds() {
    return (
      <aside>
        <AdsenseComp
          client="ca-pub-1234567890123456"   // string | requerido | "ca-pub-*"
          slot="9876543210"                  // string | requerido | id de bloque
          format="auto"                      // "auto"|"rectangle"|"vertical"|"horizontal" | opcional | default: "auto"
          responsive                         // boolean | opcional | default: true
          layout="in-article"                // string | opcional
          layoutKey="-gw-3+1f-3d+2z"         // string | opcional
          style={{ display:"block", minHeight:250 }} // React.CSSProperties | opcional
          className="my-6"
        />
      </aside>
    );
  }
────────────────────────────────────────────────────────── */
