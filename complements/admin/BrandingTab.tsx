'use client';

import React from 'react';
import type iBranding from '@/app/lib/branding/interface';
import { useEffect, useState } from "react";
import { getBrandingEffectiveForUI } from "@/complements/data/ruleUI";

// Branding (leer RAW + guardar GLOBAL)
import { getBrandingAdminRaw as getBrandingRaw, saveBrandingGlobal } from '@/complements/data/brandingFS';

// i18n único (leer/guardar diccionario por locale)
import { getI18nEffective, saveI18n, type I18nDict } from '@/complements/data/i18nFS';

// Locales visibles (ajusta codes a tus seeds/FS)
const LOCALE_COLUMNS = [
  { label: 'es', code: 'es' },
  { label: 'en', code: 'en' },
  { label: 'fr', code: 'fr' },
];

// ---------------- helpers ----------------
const setByPath = (obj: any, path: string, value: any) => {
  const parts = path.split('.');
  const last = parts.pop()!;
  const target = parts.reduce((acc, k) => (acc[k] ??= {}), obj);
  target[last] = value;
  return obj;
};

// Filtra ReactElements (<FM/>) para no enviar al GLOBAL
const stripFM = (v: any): any => {
  if (Array.isArray(v)) return v.map(stripFM);
  if (React.isValidElement(v)) return undefined;
  if (v && typeof v === 'object') {
    const out: any = {};
    for (const k of Object.keys(v)) {
      const sv = stripFM(v[k]);
      if (sv !== undefined) out[k] = sv;
    }
    return out;
  }
  return v;
};

const looksUrl = (s: string) => /^https?:\/\//i.test(s);
const looksImg = (s: string) => /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(s);

// ---------------- Array editor compacto ----------------
function ArrayField({
  path,
  label,
  value,
  onChange,
  renderItem,
}: {
  path: string;
  label?: string;
  value: any[];
  onChange: (path: string, v: any[]) => void;
  renderItem: (subPath: string, v: any) => React.ReactNode;
}) {
  const removeItem = (i: number) => onChange(path, value.filter((_, j) => j !== i));
  const addItem = () => onChange(path, [...value, '']);
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const next = value.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onChange(path, next);
  };

  return (
    <fieldset className="rounded-lg border border-[#1f2937] px-3 py-2 my-2">
      <legend className="px-1 text-xs opacity-80">{label ?? path}</legend>
      <div className="flex flex-col gap-2">
        {value.map((item, i) => (
          <div key={`${path}-${i}`} className="rounded border border-[#1f2937] p-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] opacity-60">#{i + 1}</span>
              <div className="flex gap-1">
                <button className="px-2 py-1 rounded bg-[#111827]" onClick={() => move(i, -1)} type="button">↑</button>
                <button className="px-2 py-1 rounded bg-[#111827]" onClick={() => move(i, +1)} type="button">↓</button>
                <button className="px-2 py-1 rounded bg-[#7f1d1d] text-white" onClick={() => removeItem(i)} type="button">✕</button>
              </div>
            </div>
            {renderItem(`${path}.${i}`, item)}
          </div>
        ))}
      </div>
      <button className="mt-2 px-3 py-1 rounded bg-[#2563eb] text-white text-sm" onClick={addItem} type="button">
        + Añadir
      </button>
    </fieldset>
  );
}

// ---------------- Campo mixto (muestra i18n apilado) ----------------
function FieldMixed({
  path,
  value,
  label,
  onChange,
  dicts,
  setDictValue,
}: {
  path: string;
  value: any;
  label?: string;
  onChange: (path: string, v: any) => void;
  dicts: Record<string, I18nDict>;
  setDictValue: (localeCode: string, id: string, val: string) => void;
}) {
  const idHtml = `fld-${path.replace(/\./g, '-')}`;

  // <FM/> → ID arriba, default debajo, locales debajo (apilados)
  if (React.isValidElement(value)) {
    const props = (value as React.ReactElement<any>).props ?? {};
    const fmId = props?.id as string | undefined;
    const def = (props?.defaultMessage as string | undefined) ?? '';
    if (!fmId) return null;

    return (
      <div className="rounded-lg border border-[#1f2937] p-2 my-2">
        <div className="font-mono text-[11px] break-all">{fmId}</div>
        {def ? <div className="text-xs opacity-80 mt-1">{def}</div> : null}
        <div className="mt-2 flex flex-col gap-2">
          {LOCALE_COLUMNS.map((c) => {
            const current = (dicts[c.code] && dicts[c.code][fmId]) ?? def;
            return (
              <label key={c.code} className="text-[11px] uppercase opacity-70">
                {c.label}
                <input
                  type="text"
                  className="mt-1 rounded px-2 py-1 bg-[#0f172a] border border-[#1f2937] w-full text-sm"
                  value={current}
                  onChange={(e) => setDictValue(c.code, fmId, e.target.value)}
                  placeholder={def}
                />
              </label>
            );
          })}
        </div>
      </div>
    );
  }

  // Primitivos
  if (typeof value === 'boolean') {
    return (
      <label className="flex items-center gap-2 py-1">
        <input type="checkbox" checked={!!value} onChange={(e) => onChange(path, e.target.checked)} />
        <span className="text-sm">{label ?? path}</span>
      </label>
    );
  }

  if (typeof value === 'number') {
    return (
      <div className="flex flex-col gap-1 py-1">
        <label htmlFor={idHtml} className="text-sm">{label ?? path}</label>
        <input
          id={idHtml}
          type="number"
          className="rounded px-2 py-1 bg-[#0f172a] border border-[#1f2937] w-full"
          value={value}
          onChange={(e) => onChange(path, Number(e.target.value))}
        />
      </div>
    );
  }

  if (typeof value === 'string') {
    const isUrl = looksUrl(value);
    return (
      <div className="flex flex-col gap-1 py-1">
        <label htmlFor={idHtml} className="text-sm">{label ?? path}</label>
        <div className="flex items-center gap-2">
          <input
            id={idHtml}
            type="text"
            className="rounded px-2 py-1 bg-[#0f172a] border border-[#1f2937] w-full"
            value={value}
            onChange={(e) => onChange(path, e.target.value)}
            placeholder={isUrl ? 'https://...' : ''}
          />
          {isUrl && looksImg(value) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="preview" className="h-7 w-7 rounded border border-[#1f2937] object-cover" />
          )}
        </div>
      </div>
    );
  }

  // Arrays
  if (Array.isArray(value)) {
    return (
      <ArrayField
        path={path}
        label={label}
        value={value}
        onChange={onChange}
        renderItem={(p, v) => (
          <FieldMixed
            path={p}
            value={v}
            onChange={onChange}
            dicts={dicts}
            setDictValue={setDictValue}
          />
        )}
      />
    );
  }

  // Objetos
  if (value && typeof value === 'object') {
    return (
      <fieldset className="rounded-lg border border-[#1f2937] px-3 py-2 my-2">
        <legend className="px-1 text-xs opacity-80">{label ?? path}</legend>
        <div className="flex flex-col gap-2">
          {Object.keys(value).map((k) => (
            <FieldMixed
              key={k}
              path={`${path}.${k}`}
              label={k}
              value={(value as any)[k]}
              onChange={onChange}
              dicts={dicts}
              setDictValue={setDictValue}
            />
          ))}
        </div>
      </fieldset>
    );
  }

  // Fallback JSON
  return (
    <div className="flex flex-col gap-1 py-1">
      <label htmlFor={idHtml} className="text-sm">{label ?? path} (JSON)</label>
      <textarea
        id={idHtml}
        className="rounded px-2 py-1 bg-[#0f172a] border border-[#1f2937] min-h-20"
        value={JSON.stringify(value ?? null, null, 2)}
        onChange={(e) => {
          try { onChange(path, JSON.parse(e.target.value)); } catch {}
        }}
      />
    </div>
  );
}

// ---------------- Tab principal ----------------
export default function BrandingTab() {
  const [loading, setLoading] = React.useState(true);
  const [branding, setBranding] = React.useState<iBranding<any> | null>(null); // RAW (con FM)
  const [dicts, setDicts] = React.useState<Record<string, I18nDict>>({});
  const [saving, setSaving] = React.useState(false);

  // NUEVO: controles de vista previa efectiva por locale
  const [activeLocale, setActiveLocale] = useState<string>(LOCALE_COLUMNS[0].code);
  const [previewEff, setPreviewEff] = useState<any | null>(null);
  const [previewProv, setPreviewProv] = useState<any | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Carga inicial: RAW + diccionarios por locale
  React.useEffect(() => {
    (async () => {
      setLoading(true);

      // Estructura RAW de branding (con <FM/>)
      const raw = await getBrandingRaw(LOCALE_COLUMNS[0].code);

      // Diccionarios efectivos por locale (única fuente de textos)
      const dictEntries = await Promise.all(
        LOCALE_COLUMNS.map(async (c) => [c.code, await getI18nEffective(c.code)] as const)
      );

      setBranding(raw);
      setDicts(Object.fromEntries(dictEntries));
      setLoading(false);
    })();
  }, []);

  // NUEVO: vista previa efectiva por locale (regla FS > TSX(FM) > JSON > TSX)
  useEffect(() => {
    let cancel = false;
    (async () => {
      const { effective, provenance } = await getBrandingEffectiveForUI(activeLocale);
      if (!cancel) {
        setPreviewEff(effective);
        setPreviewProv(provenance);
      }
    })();
    return () => { cancel = true; };
  }, [activeLocale]);

  const updateBranding = (path: string, v: any) => {
    setBranding((prev) => {
      const clone = JSON.parse(JSON.stringify(prev ?? {}));
      setByPath(clone, path, v);
      return clone;
    });
  };

  const setDictValue = (localeCode: string, id: string, val: string) => {
    setDicts((prev) => ({
      ...prev,
      [localeCode]: { ...(prev[localeCode] || {}), [id]: val },
    }));
  };

  const onSaveAll = async () => {
    if (!branding) return;
    setSaving(true);
    try {
      await Promise.all(
        LOCALE_COLUMNS.map((c) => saveI18n(c.code, dicts[c.code] || {}))
      );

      // 2) Guardar estructura global de branding (sin <FM/>)
      const globalPayload = stripFM(branding);
      await saveBrandingGlobal(globalPayload);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !branding) return <div className="opacity-70">Cargando…</div>;

  const topKeys = Object.keys(branding as any);

  return (
    <div className="space-y-2 pb-16">
      <h2 className="text-base font-semibold">Branding</h2>

      {/* NUEVO: selector de locale + toggle de vista previa */}
      <div className="flex items-center gap-2 mb-2">
        <label className="text-sm opacity-80">Locale:</label>
        <select
          className="rounded border border-[#1f2937] bg-[#0f172a] px-2 py-1 text-sm"
          value={activeLocale}
          onChange={(e) => setActiveLocale(e.target.value)}
        >
          {LOCALE_COLUMNS.map(c => (
            <option key={c.code} value={c.code}>{c.label} ({c.code})</option>
          ))}
        </select>

        <button
          type="button"
          className="ml-auto rounded px-3 py-1 text-sm border border-[#1f2937] bg-[#0d1326]"
          onClick={() => setShowPreview(v => !v)}
        >
          {showPreview ? `Ocultar vista previa ${activeLocale}` : `Ver vista previa efectiva ${activeLocale}`}
        </button>
      </div>

      {showPreview && (
        <details open className="rounded-lg border border-[#1f2937] bg-[#0b1220] mb-2">
          <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium bg-[#0d1326]">
            Vista previa efectiva (solo lectura) — {activeLocale}
          </summary>
          <div className="px-3 pb-3 pt-2 grid grid-cols-1 gap-2">
            <div className="text-xs opacity-70">Regla: FS &gt; TSX(FM) &gt; JSON &gt; TSX</div>
            <div className="rounded border border-[#1f2937] p-2 overflow-auto">
              <pre className="whitespace-pre-wrap text-xs">
{JSON.stringify(previewEff ?? {}, null, 2)}
              </pre>
            </div>
            <details className="rounded border border-[#1f2937] p-2">
              <summary className="cursor-pointer text-xs opacity-80">Provenance (capas por clave)</summary>
              <pre className="whitespace-pre-wrap text-[11px] opacity-80">
{JSON.stringify(previewProv ?? {}, null, 2)}
              </pre>
            </details>
          </div>
        </details>
      )}

      {topKeys.map((k) => {
        const val = (branding as any)[k];
        return (
          <details key={k} open className="rounded-lg border border-[#1f2937] bg-[#0b1220]">
            <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium bg-[#0d1326]">
              {k}
            </summary>
            <div className="px-3 pb-3 pt-2">
              <FieldMixed
                path={k}
                label={k}
                value={val}
                onChange={updateBranding}
                dicts={dicts}
                setDictValue={setDictValue}
              />
            </div>
          </details>
        );
      })}

      {/* Botón flotante único */}
      <div className="fixed bottom-3 right-3 z-50">
        <button
          className="rounded px-4 py-2 bg-[#2563eb] text-white shadow-lg text-sm disabled:opacity-60"
          onClick={onSaveAll}
          disabled={saving}
          title="Guardar diccionarios i18n + branding global (sin <FM/>)"
        >
          {saving ? 'Guardando…' : 'Guardar todo'}
        </button>
      </div>
    </div>
  );
}
