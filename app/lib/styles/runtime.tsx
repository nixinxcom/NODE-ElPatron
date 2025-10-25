// app/lib/styles/runtime.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { onSnapshot, doc, getDoc } from "firebase/firestore";
import { FbDB } from "@/app/lib/services/firebase";
import type { StylesDoc } from "@/app/lib/styles/types";
import { stylesSeed } from "@/seeds/styles"; // FS > TSX

type AnyRec = Record<string, any>;
type Alias = { light: string; dark: string };

// --------- Config Firestore ---------
const STYLES_REF = doc(
  FbDB,
  process.env.NEXT_PUBLIC_STYLES_COLL || "styles",
  process.env.NEXT_PUBLIC_STYLES_DOC || "default"
);

// --------- Utils ---------
function overlay<T extends AnyRec>(a: T, b: AnyRec): T {
  if (!b) return a;
  const out: AnyRec = Array.isArray(a) ? [...(a as any)] : { ...(a as any) };
  for (const k of Object.keys(b)) {
    const v = (b as any)[k];
    if (v && typeof v === "object" && !Array.isArray(v)) {
      (out as any)[k] = overlay((out as any)[k] ?? {}, v);
    } else {
      (out as any)[k] = v;
    }
  }
  return out as T;
}
const SEED_BASE: StylesDoc = overlay(stylesSeed as any, {}) as any;

const STATES = ["rest", "hover", "active", "disabled", "highlight", "highhover"] as const;
const toKebab = (s: string) => s.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());

function deriveThemes(schema: any): string[] {
  const set = new Set<string>();
  for (const k of Object.keys(schema?.global?.body ?? {})) set.add(k);
  for (const comp of Object.keys(schema?.components ?? {})) {
    for (const th of Object.keys(schema.components[comp] ?? {})) {
      if (th !== "base" && th !== "kinds") set.add(th);
    }
  }
  return set.size ? Array.from(set) : ["light", "dark"];
}

/** Estructura directa: schema.components[comp][theme][state] = tokens */
function resolveThemeRef(schema: any, comp: string, theme: string): AnyRec | undefined {
  return schema?.components?.[comp]?.[theme];
}

/** Aplana esquema → mapa de variables CSS físicas, incluyendo kinds */
function flattenSchemaToVars(schema: any): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  const themes = deriveThemes(schema);

  // Componentes (tema → estado)
  for (const comp of Object.keys(schema?.components ?? {})) {
    const compNode = schema.components[comp] || {};

    // 1) temas "directos"
    for (const th of themes) {
      const themeBlock = resolveThemeRef(schema, comp, th) ?? {};
      for (const st of STATES) {
        const tok: AnyRec = themeBlock?.[st] ?? {};
        for (const [k, v] of Object.entries(tok)) {
          if (v != null) out[`--${comp}-${k}-${th}-${st}`] = v as any;
        }
      }
    }

    // 2) base (opcional): no genera variables específicas, sirve de herencia (ya se fusiona antes en FS/seed si procede)

    // 3) kinds dinámicos → variables: --{comp}-{kind}-{prop}-{theme}-{state}
    const kinds = compNode?.kinds || {};
    for (const kind of Object.keys(kinds)) {
      const kindNode = kinds[kind] || {};
      for (const th of Object.keys(kindNode)) {
        const stMap = kindNode[th] || {};
        for (const st of STATES) {
          const tok: AnyRec = stMap?.[st] ?? {};
          for (const [k, v] of Object.entries(tok)) {
            if (v != null) out[`--${comp}-${kind}-${k}-${th}-${st}`] = v as any;
          }
        }
      }
    }
  }

  // Global (body) sin estado
  for (const th of themes) {
    const g: AnyRec = schema?.global?.body?.[th] ?? {};
    for (const [k, v] of Object.entries(g)) {
      if (v != null) out[`--body-${k}-${th}`] = v as any;
    }
  }

  return out;
}

/** Vuelca tokens planos a :root (camel + kebab) */
function dumpFlatTokensAsCss(tokens: Record<string, string | number>): string {
  const lines: string[] = [":root{"];
  for (const [name, value] of Object.entries(tokens)) {
    lines.push(`${name}:${String(value)};`);
    const kebab = name.replace(
      /--([a-z]+)-([A-Za-z]+)-(.*)/,
      (_, c, p, tail) => `--${c}-${toKebab(p)}-${tail}`
    );
    if (kebab !== name) lines.push(`${kebab}:${String(value)};`);
  }
  lines.push("}");
  return lines.join("");
}

/** Alias mapping para slots → temas físicos (soporta kinds) */
function emitAliasMappingFromFlatTokens(
  tokens: Record<string, string | number>,
  a?: { light: string; dark: string }
): string {
  if (!a?.light || !a?.dark) return ":root{}";

  // Si el alias coincide con el slot, NO generes remapeo (evita var(--x):var(--x))
  const sameLight = a.light === "light";
  const sameDark  = a.dark  === "dark";

  const compEntries = new Set<string>(); // comp|kind?|prop|state
  const bodyProps = new Set<string>();

  const reWithKind = /^--([a-z0-9-]+)-([a-zA-Z0-9_]+)-([A-Za-z]+)-([a-zA-Z0-9_]+)-([a-z]+)$/;
  const reNoKind   = /^--([a-z0-9-]+)-([A-Za-z]+)-([a-zA-Z0-9_]+)-([a-z]+)$/;
  const reBody     = /^--body-([A-Za-z]+)-([a-zA-Z0-9_]+)$/;

  for (const key of Object.keys(tokens)) {
    let m = key.match(reWithKind);
    if (m) { const [, comp, kind, prop, , state] = m; compEntries.add(`${comp}|${kind}|${prop}|${state}`); continue; }
    m = key.match(reNoKind);
    if (m) { const [, comp, prop, , state] = m;     compEntries.add(`${comp}|-|${prop}|${state}`); continue; }
    m = key.match(reBody);
    if (m) { const [, prop] = m; bodyProps.add(prop); }
  }

  const out: string[] = [":root{"];

  for (const id of Array.from(compEntries)) {
    const [comp, kind, prop, state] = id.split("|");
    const prefix = kind !== "-" ? `--${comp}-${kind}-${prop}` : `--${comp}-${prop}`;
    if (!sameLight) out.push(`${prefix}-light-${state}:var(${prefix}-${a.light}-${state});`);
    if (!sameDark)  out.push(`${prefix}-dark-${state}:var(${prefix}-${a.dark}-${state});`);
  }

  for (const prop of Array.from(bodyProps)) {
    if (!sameLight) out.push(`--body-${prop}-light:var(--body-${prop}-${a.light});`);
    if (!sameDark)  out.push(`--body-${prop}-dark:var(--body-${prop}-${a.dark});`);
  }

  out.push("}");
  return out.join("");
}

/** Body: crea variables efectivas dependientes del slot activo */
function emitActiveBodyVars(
  tokens: Record<string, string | number>
): string {
  const reBody = /^--body-([A-Za-z]+)-([a-zA-Z0-9_]+)$/;

  // junta props del body en array único (sin Set)
  const propsArr: string[] = [];
  for (const k of Object.keys(tokens)) {
    const m = reBody.exec(k);
    if (m) {
      const p = m[1];
      if (propsArr.indexOf(p) === -1) propsArr.push(p);
    }
  }

  const light: string[] = ['html[data-theme="light"]{'];
  const dark : string[] = ['html[data-theme="dark"]{'];

  for (let i = 0; i < propsArr.length; i++) {
    const p = propsArr[i];
    light.push(`--body-${p}:var(--body-${p}-light);`);
    dark.push (`--body-${p}:var(--body-${p}-dark);`);
  }

  light.push('}');
  dark.push('}');
  return light.join('') + '\n' + dark.join('');
}

/** Clases dinámicas de variantes para botón: .btn--{kind} */
const BTN_PROP_MAP: Record<string, string> = {
  backgroundColor: "bg",
  textColor: "fg",
  borderColor: "bc",
  borderWidth: "bw",
  borderRadius: "br",
  paddingX: "px",
  paddingY: "py",
  boxShadow: "shadow",
  opacity: "opacity", // sólo en disabled
};

function emitButtonVariantClasses(doc: any): string {
  const kinds = Object.keys(doc?.components?.button?.kinds || {});
  if (!kinds.length) return "";

  const states = ["rest", "hover", "active", "disabled", "highlight", "highhover"];
  const slots: Array<"light" | "dark"> = ["light", "dark"];
  const lines: string[] = [];

  for (const kind of kinds) {
    for (const slot of slots) {
      lines.push(`html[data-theme="${slot}"] .btn--${kind}{`);

      // REST
      for (const [prop, short] of Object.entries(BTN_PROP_MAP)) {
        if (prop === "opacity") continue;
        lines.push(
          `--btn-${short}-rest: var(--button-${kind}-${prop}-${slot}-rest, var(--btn-${short}-rest));`
        );
      }

      // HOVER / ACTIVE
      for (const st of ["hover", "active"]) {
        for (const [prop, short] of Object.entries(BTN_PROP_MAP)) {
          if (prop === "opacity") continue;
          lines.push(
            `--btn-${short}-${st}: var(--button-${kind}-${prop}-${slot}-${st}, var(--btn-${short}-${st}));`
          );
        }
      }

      // DISABLED (+ opacity)
      for (const [prop, short] of Object.entries(BTN_PROP_MAP)) {
        if (prop === "opacity") {
          lines.push(
            `--btn-opacity-disabled: var(--button-${kind}-opacity-${slot}-disabled, var(--btn-opacity-disabled));`
          );
        } else {
          lines.push(
            `--btn-${short}-disabled: var(--button-${kind}-${prop}-${slot}-disabled, var(--btn-${short}-disabled));`
          );
        }
      }

      // HIGHLIGHT / HIGHHOVER (si existen)
      for (const [prop, short] of Object.entries(BTN_PROP_MAP)) {
        if (prop === "opacity") continue;
        lines.push(
          `--btn-${short}-highlight-rest: var(--button-${kind}-${prop}-${slot}-highlight, var(--btn-${short}-highlight-rest));`
        );
        lines.push(
          `--btn-${short}-highhover: var(--button-${kind}-${prop}-${slot}-highhover, var(--btn-${short}-highhover));`
        );
      }

      lines.push("}");
    }
  }

  return lines.join("\n");
}


/** Igual que button pero para LINK */
const LINK_PROP_MAP: Record<string, string> = {
  backgroundColor: "bg",
  textColor: "fg",
  borderColor: "bc",
  borderWidth: "bw",
  borderRadius: "br",
  paddingX: "px",
  paddingY: "py",
  boxShadow: "shadow",
};

function emitLinkVariantClasses(doc: any): string {
  const kinds = Object.keys(doc?.components?.link?.kinds || {});
  if (!kinds.length) return "";

  const states = ["rest", "hover", "active", "disabled", "highlight", "highhover"];
  const slots: Array<"light" | "dark"> = ["light", "dark"];
  const lines: string[] = [];

  for (const kind of kinds) {
    for (const slot of slots) {

      // Base REST (igual que Btn → link--{kind})
      lines.push(`html[data-theme="${slot}"] .link--${kind}{`);
      for (const [prop, short] of Object.entries(LINK_PROP_MAP)) {
        lines.push(
          `--link-${short}-rest: var(--link-${kind}-${prop}-${slot}-rest, var(--link-${short}-rest));`
        );
      }
      lines.push("}");

      // Hover / Active
      lines.push(`html[data-theme="${slot}"] .link--${kind}:hover{`);
      for (const [prop, short] of Object.entries(LINK_PROP_MAP)) {
        lines.push(
          `--link-${short}-hover: var(--link-${kind}-${prop}-${slot}-hover, var(--link-${short}-hover));`
        );
      }
      lines.push("}");

      lines.push(`html[data-theme="${slot}"] .link--${kind}:active{`);
      for (const [prop, short] of Object.entries(LINK_PROP_MAP)) {
        lines.push(
          `--link-${short}-active: var(--link-${kind}-${prop}-${slot}-active, var(--link-${short}-active));`
        );
      }
      lines.push("}");

      // Disabled
      lines.push(`html[data-theme="${slot}"] .link--${kind}[disabled], html[data-theme="${slot}"] .link--${kind}[aria-disabled="true"]{`);
      for (const [prop, short] of Object.entries(LINK_PROP_MAP)) {
        lines.push(
          `--link-${short}-disabled: var(--link-${kind}-${prop}-${slot}-disabled, var(--link-${short}-disabled));`
        );
      }
      lines.push("}");

      // Highlight / Highhover
      lines.push(`html[data-theme="${slot}"] .link--${kind}.link-highlight{`);
      for (const [prop, short] of Object.entries(LINK_PROP_MAP)) {
        lines.push(
          `--link-${short}-highlight-rest: var(--link-${kind}-${prop}-${slot}-highlight, var(--link-${short}-highlight-rest));`
        );
      }
      lines.push("}");
      lines.push(`html[data-theme="${slot}"] .link--${kind}.link-highlight:hover{`);
      for (const [prop, short] of Object.entries(LINK_PROP_MAP)) {
        lines.push(
          `--link-${short}-highhover: var(--link-${kind}-${prop}-${slot}-highhover, var(--link-${short}-highhover));`
        );
      }
      lines.push("}");
    }
  }

  return lines.join("\n");
}

/** Genera el CSS final desde docState (FS > seed), con alias y variantes */
export function generateCss(docState: any, aliases?: Alias) {
  const a: Alias | undefined = aliases && aliases.light && aliases.dark ? aliases : undefined;

  const tokensFlat: Record<string, string | number> =
    docState?.cssVariables ?? docState?.flat ?? flattenSchemaToVars(docState ?? {});

  const cssTokens    = dumpFlatTokensAsCss(tokensFlat);
  const cssAlias     = a ? emitAliasMappingFromFlatTokens(tokensFlat, a) : ":root{}";
  const cssBtnKinds  = emitButtonVariantClasses(docState);
  const cssLinkKinds = emitLinkVariantClasses(docState);

  // ⬇️ NUEVO: variables efectivas del body por slot activo
  const cssBodyActive = emitActiveBodyVars(tokensFlat);

  // agrega cssBodyActive al join
  return [cssTokens, cssAlias, cssBtnKinds, cssLinkKinds, cssBodyActive].join("\n");
}


// --------- State (FS) ---------
function useStylesDoc() {
  const [state, setState] = useState<any | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(STYLES_REF, (snap) => {
      setState((snap.data() as any) || null);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    // Primer paint: trae snapshot actual
    (async () => {
      try {
        const snap = await getDoc(STYLES_REF);
        if (snap.exists()) setState((snap.data() as any) || null);
      } catch {}
    })();
  }, []);

  return state;
}

// --------- React provider ---------
export function StylesRuntimeProvider({
  children,
  aliases,
  alias,
}: {
  children: React.ReactNode;
  aliases?: Alias;
  alias?: Alias;
}) {
  const styleRef = useRef<HTMLStyleElement | null>(null);
  const docState = useStylesDoc();

  const applyCss = (css: string) => {
    if (!styleRef.current) return;
    styleRef.current.textContent = css;
  };

  // 1) Montaje: publica tokens del SEED (para que .btn/.input pinten YA)
  useEffect(() => {
    if (styleRef.current) return;
    const el = document.createElement("style");
    el.setAttribute("id", "styles-runtime");
    document.head.appendChild(el);
    styleRef.current = el;

    const seedFlat = flattenSchemaToVars(SEED_BASE);

    // Debug opcional
    if (process.env.NODE_ENV !== "production") {
      try {
        // @ts-ignore
        window.__seedFlatSize = Object.keys(seedFlat).length;
        // @ts-ignore
        window.__seedSample = Object.entries(seedFlat).slice(0, 6);
      } catch {}
    }

    const cssSeedTokens = dumpFlatTokensAsCss(seedFlat);
    const cssSeedAlias = ":root{}"; // sin alias en el seed
    const cssSeedBtnKinds = emitButtonVariantClasses(SEED_BASE);

    const cssSeedLinkKinds = emitLinkVariantClasses(SEED_BASE);

    applyCss([cssSeedTokens, cssSeedAlias, cssSeedBtnKinds, cssSeedLinkKinds].join("\n"));
  }, []);

  // 2) Cuando llegue FS o cambien aliases → sobre-escribe (FS > TSX)
  useEffect(() => {
    if (!styleRef.current) return;
    if (!docState) return; // si FS aún no llegó, seguimos con el seed publicado

    const effective: Alias | undefined =
      aliases ?? alias ?? (docState?.aliases as Alias | undefined);

    const css = generateCss(docState, effective);
    applyCss(css);
  }, [docState, aliases, alias]);

  return <>{children}</>;
}

export default StylesRuntimeProvider;
