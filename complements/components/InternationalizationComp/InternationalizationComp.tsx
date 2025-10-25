'use client';

import Image from "next/image";
import Link from "next/link";
import styles from "./InternationalizationComp.module.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

interface iLanguages {
  language?: string;
  locale?: string;   // "es" | "es-MX" | "en-US" | "fr-CA"
  icon?: string;
  country?: string;
  alt?: string;
  prioritario?: boolean;
  width?: number;
  height?: number;
  fill?: boolean;
}

interface iInternational {
  Langs: iLanguages[];
  Position?: "relative" | "absolute" | "fixed";
  BackgroundColor?: string;
  Top?: string;
  Bottom?: string;
  Left?: string;
  Right?: string;
  ShowLangs?: "all" | "oneBYone";
}

const SHORTS = ["es","en","fr"] as const;
type Short = typeof SHORTS[number];

function shortOf(input?: string): Short {
  if (!input) return "es";
  const v = String(input).toLowerCase();
  if (v.startsWith("es")) return "es";
  if (v.startsWith("fr")) return "fr";
  return "en";
}

export default function InterComp(props: iInternational) {
  const [minimized, setMinimized] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname() || "/";
  const qs = useSearchParams();

  // Auto-minimizar
  useEffect(() => {
    timerRef.current = setTimeout(() => setMinimized(true), 7000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);
  useEffect(() => {
    if (!minimized) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setMinimized(true), 3500);
    }
  }, [minimized]);

  const toggleMinimized = () => setMinimized(prev => !prev);

  if (!props.Langs?.length) return null;

  // Orden normalizado (corto) exactamente según tu array
  const order = useMemo(() => {
    return props.Langs.map((l, idx) => ({ idx, short: shortOf(l.locale) }));
  }, [props.Langs]);

  // Locale actual tomado de la URL (fuente de verdad)
  const firstSeg = (pathname.split("/")[1] || "").toLowerCase(); // "en" o "fr-ca"
  const currentShort = shortOf(firstSeg);

  // Helpers para construir href preservando path + query + hash
  const buildHref = (targetShort: Short) => {
    const first = (pathname.split("/")[1] || "").toLowerCase();
    const firstShort = shortOf(first);
    const hasLocale = !!first && (first === firstShort || first.startsWith(firstShort + "-"));
    const cutLen = hasLocale ? 1 + first.length : 0;               // incluye '/'
    const rest = hasLocale ? (pathname.slice(cutLen) || "/") : pathname;
    const tail = rest === "/" ? "" : rest;
    const query = qs && qs.toString() ? `?${qs}` : "";
    const hash = (typeof window !== "undefined" && window.location.hash) ? window.location.hash : "";
    return `/${targetShort}${tail}${query}${hash}`;
  };

  // Índices deterministas en TU orden
  const currentIdx = useMemo(() => {
    const i = order.findIndex(o => o.short === currentShort);
    return i >= 0 ? i : 0;
  }, [order, currentShort]);

  const nextIdx = useMemo(() => {
    if (!order.length) return 0;
    return (currentIdx + 1) % order.length; // siguiente en tu orden: es→en→fr→es…
  }, [order, currentIdx]);

  return (
    <div
      className={`${styles.LangsContainer} ${minimized ? styles.minimized : styles.expanded}`}
      style={{
        position: props.Position,
        backgroundColor: props.BackgroundColor,
        top: props.Top,
        bottom: props.Bottom,
        left: props.Left,
        right: props.Right,
      }}
      onClick={toggleMinimized}
    >
      {props.ShowLangs === "oneBYone" ? (
        // Muestra SIEMPRE el “siguiente” respecto al actual → primer clic siempre cambia
        <div className={styles.Lngdiv} key={`one-${nextIdx}`}>
          {props.Langs[nextIdx]?.icon && (
            <Link
              href={buildHref(order[nextIdx].short)}
              replace
              scroll={false}
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={props.Langs[nextIdx].icon!}
                width={props.Langs[nextIdx].width}
                height={props.Langs[nextIdx].height}
                priority={props.Langs[nextIdx].prioritario}
                alt={props.Langs[nextIdx].alt || ""}
              />
            </Link>
          )}
          {!minimized && props.Langs[nextIdx]?.language && (
            <p className={styles.LngLgnd}>{props.Langs[nextIdx].language}</p>
          )}
        </div>
      ) : (
        // "all": respeta el orden exactamente como lo envías
        props.Langs.map((lang, index) => (
          <div className={styles.Lngdiv} key={`all-${index}`}>
            {lang.icon && (
              <Link
                href={buildHref(shortOf(lang.locale))}
                replace
                scroll={false}
                onClick={(e) => e.stopPropagation()}
              >
                <Image
                  src={lang.icon}
                  width={lang.width}
                  height={lang.height}
                  priority={lang.prioritario}
                  alt={lang.alt || ""}
                />
              </Link>
            )}
            {!minimized && lang.language && (
              <p className={styles.LngLgnd}>{lang.language}</p>
            )}
          </div>
        ))
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
DOC: InternationalizationComp — complements/components/InternationalizationComp/InternationalizationComp.tsx
QUÉ HACE:
  Selector de idioma/locale (es/en/fr) que ajusta rutas (subpaths) y persiste preferencia.

API / EXPORTS / RUTA:
  — export interface IntlCompProps { locales?: Array<"es"|"en"|"fr">; current?: "es"|"en"|"fr"; onChange?: (l:"es"|"en"|"fr")=>void; className?: string }
  — export default function InternationalizationComp(p:IntlCompProps): JSX.Element

USO (ejemplo completo):
  <InternationalizationComp current="es" onChange={(l)=>location.assign(`/${l}`)} />

NOTAS CLAVE:
  — Usar buildI18nHref para generar URLs correctas con query/hash.
  — Guardar elección en cookie/storage (“locale”).

DEPENDENCIAS:
  "@/app/lib/useI18nHref" (opcional) · storage/cookies helpers
────────────────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────────────
DOC: USO — complements/components/InternationalizationComp/InternationalizationComp.tsx
  "use client";
  import InternationalizationComp from "@/complements/components/InternationalizationComp/InternationalizationComp";

  export default function LocaleSwitcher() {
    return (
      <InternationalizationComp
        locales={["es","en","fr"]}           // Array<"es"|"en"|"fr"> | opcional
        current="es"                          // "es"|"en"|"fr" | opcional
        onChange={(l)=>location.assign(`/${l}`)} // (l)=>void | opcional
        className="ml-auto"
      />
    );
  }
────────────────────────────────────────────────────────── */
