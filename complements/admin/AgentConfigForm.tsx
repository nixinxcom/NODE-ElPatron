'use client';

import React from 'react';

// Tipos
import type iSettings from '@/app/lib/settings/interface';
import type iBranding from '@/app/lib/branding/interface';
import type { BrandingFS } from '@/complements/data/brandingFS';

// Settings (leer/guardar)
import { getSettingsEffective } from '@/complements/data/settingsFS';
import { saveSettingsClient } from '@/app/lib/settings/client';

// Branding (leer/guardar)
import { saveBrandingGlobal } from '@/complements/data/brandingFS';
import { getBrandingAdminRaw as getBrandingRaw } from '@/complements/data/brandingFS';
import { toShortLocale, DEFAULT_LOCALE_SHORT } from '@/app/lib/i18n/locale';

// i18n (ÚNICA colección: i18n_global/{locale})
import {
  getI18nEffective,
  saveI18n,
  type I18nDict,
} from '@/complements/data/i18nFS';

// ===== Config locales visibles (ajusta a tus seeds/FS) =====================
const LOCALES = [
  { label: 'es', code: 'es' },
  { label: 'en', code: 'en' },
  { label: 'fr', code: 'fr' },
];

// ===== Helpers ==============================================================
const looksUrl = (s: string) => /^https?:\/\//i.test(s);
const looksImg = (s: string) => /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(s);

const getByPath = (obj: any, path: string) =>
  path.split('.').reduce((a, k) => (a?.[k]), obj);

const setByPath = (obj: any, path: string, value: any) => {
  const parts = path.split('.');
  const last = parts.pop()!;
  const target = parts.reduce((acc, k) => (acc[k] ??= {}), obj);
  target[last] = value;
  return obj;
};

// Quita ReactElements (<FM/>) del subárbol (para guardar en branding/default)
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

// Subtipo exacto de branding.agentAI
type AgentAISubtree = NonNullable<BrandingFS['agentAI']>;

// ====== Array editor compacto ==============================================
function ArrayField({
  path, label, value, onChange, renderItem,
}: {
  path: string; label?: string; value: any[];
  onChange: (path: string, v: any[]) => void;
  renderItem: (subPath: string, v: any) => React.ReactNode;
}) {
  const rm = (i: number) => onChange(path, value.filter((_: any, j: number) => j !== i));
  const add = () => onChange(path, [...value, '']);
  const mv = (i: number, d: -1 | 1) => {
    const j = i + d; if (j < 0 || j >= value.length) return;
    const next = value.slice(); [next[i], next[j]] = [next[j], next[i]];
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
                <button className="px-2 py-1 rounded bg-[#111827]" onClick={() => mv(i, -1)} type="button">↑</button>
                <button className="px-2 py-1 rounded bg-[#111827]" onClick={() => mv(i, +1)} type="button">↓</button>
                <button className="px-2 py-1 rounded bg-[#7f1d1d] text-white" onClick={() => rm(i)} type="button">✕</button>
              </div>
            </div>
            {renderItem(`${path}.${i}`, item)}
          </div>
        ))}
      </div>
      <button className="mt-2 px-3 py-1 rounded bg-[#2563eb] text-white text-sm" onClick={add} type="button">
        + Añadir
      </button>
    </fieldset>
  );
}

// ====== Campos para SETTINGS (no i18n) =====================================
function FieldSettings({
  path, value, label, onChange,
}: {
  path: string; value: any; label?: string;
  onChange: (path: string, v: any) => void;
}) {
  const id = `s-${path.replace(/\./g, '-')}`;

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
        <label htmlFor={id} className="text-sm">{label ?? path}</label>
        <input id={id} type="number" className="rounded px-2 py-1 bg-[#0f172a] border border-[#1f2937]"
          value={value} onChange={(e) => onChange(path, Number(e.target.value))} />
      </div>
    );
  }
  if (typeof value === 'string') {
    const isUrl = looksUrl(value);
    return (
      <div className="flex flex-col gap-1 py-1">
        <label htmlFor={id} className="text-sm">{label ?? path}</label>
        <div className="flex items-center gap-2">
          <input id={id} type="text" className="rounded px-2 py-1 bg-[#0f172a] border border-[#1f2937] w-full"
            value={value} onChange={(e) => onChange(path, e.target.value)} placeholder={isUrl ? 'https://...' : ''} />
          {isUrl && looksImg(value) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="pv" className="h-7 w-7 rounded border border-[#1f2937] object-cover" />
          )}
        </div>
      </div>
    );
  }
  if (Array.isArray(value)) {
    return (
      <ArrayField
        path={path} label={label} value={value} onChange={onChange}
        renderItem={(p, v) => <FieldSettings path={p} value={v} onChange={onChange} />}
      />
    );
  }
  if (value && typeof value === 'object') {
    return (
      <fieldset className="rounded-lg border border-[#1f2937] px-3 py-2 my-2">
        <legend className="px-1 text-xs opacity-80">{label ?? path}</legend>
        <div className="flex flex-col gap-2">
          {Object.keys(value).map((k) => (
            <FieldSettings key={k} path={`${path}.${k}`} label={k} value={(value as any)[k]} onChange={onChange} />
          ))}
        </div>
      </fieldset>
    );
  }
  return (
    <div className="flex flex-col gap-1 py-1">
      <label htmlFor={id} className="text-sm">{label ?? path} (JSON)</label>
      <textarea id={id} className="rounded px-2 py-1 bg-[#0f172a] border border-[#1f2937] min-h-20"
        value={JSON.stringify(value ?? null, null, 2)}
        onChange={(e) => { try { onChange(path, JSON.parse(e.target.value)); } catch {} }} />
    </div>
  );
}

// ====== Campos para BRANDING (i18n si aplica) ===============================
function FieldBranding({
  path, value, label, onChange, dicts, setDictValue,
}: {
  path: string; value: any; label?: string;
  onChange: (path: string, v: any) => void;
  dicts: Record<string, I18nDict>;
  setDictValue: (locale: string, id: string, value: string) => void;
}) {
  const id = `b-${path.replace(/\./g, '-')}`;

  // <FM id="…"/> → ID arriba, default debajo, inputs por locale apilados
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
          {LOCALES.map((c) => {
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
        <label htmlFor={id} className="text-sm">{label ?? path}</label>
        <input id={id} type="number" className="rounded px-2 py-1 bg-[#0f172a] border border-[#1f2937]"
          value={value} onChange={(e) => onChange(path, Number(e.target.value))} />
      </div>
    );
  }
  if (typeof value === 'string') {
    const isUrl = looksUrl(value);
    return (
      <div className="flex flex-col gap-1 py-1">
        <label htmlFor={id} className="text-sm">{label ?? path}</label>
        <div className="flex items-center gap-2">
          <input id={id} type="text" className="rounded px-2 py-1 bg-[#0f172a] border border-[#1f2937] w-full"
            value={value} onChange={(e) => onChange(path, e.target.value)} placeholder={isUrl ? 'https://...' : ''} />
          {isUrl && looksImg(value) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="pv" className="h-7 w-7 rounded border border-[#1f2937] object-cover" />
          )}
        </div>
      </div>
    );
  }

  // Arrays
  if (Array.isArray(value)) {
    return (
      <ArrayField
        path={path} label={label} value={value} onChange={onChange}
        renderItem={(p, v) => (
          <FieldBranding
            path={p} value={v} onChange={onChange} dicts={dicts} setDictValue={setDictValue}
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
            <FieldBranding
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
      <label htmlFor={id} className="text-sm">{label ?? path} (JSON)</label>
      <textarea
        id={id}
        className="rounded px-2 py-1 bg-[#0f172a] border border-[#1f2937] min-h-20"
        value={JSON.stringify(value ?? null, null, 2)}
        onChange={(e) => { try { onChange(path, JSON.parse(e.target.value)); } catch {} }}
      />
    </div>
  );
}

// ====== TAB principal =======================================================
export default function AgentAITab() {
  const [loading, setLoading] = React.useState(true);

  const [settings, setSettings] = React.useState<iSettings | null>(null);
  const [agentSettings, setAgentSettings] = React.useState<any>({}); // settings.agentAI

  const [branding, setBranding] = React.useState<iBranding<any> | null>(null);
  const [agentBranding, setAgentBranding] = React.useState<any>({}); // branding.agentAI (o alias)

  const [dicts, setDicts] = React.useState<Record<string, I18nDict>>({});
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      setLoading(true);

      // 1) Settings efectivos
      const s = await getSettingsEffective();
      setSettings(s);
      setAgentSettings(s?.agentAI ?? {});

      // 2) Branding RAW (estructura con posibles <FM/>)
      const raw = await getBrandingRaw(LOCALES[0].code);
      const subtree = getByPath(raw, 'agentAI') ?? getByPath(raw, 'agent') ?? {};
      setBranding(raw);
      setAgentBranding(subtree);

      // 3) Diccionarios efectivos para todos los locales visibles
      const dictEntries = await Promise.all(
        LOCALES.map(async (c) => [c.code, await getI18nEffective(c.code)] as const)
      );
      setDicts(Object.fromEntries(dictEntries));

      setLoading(false);
    })();
  }, []);

  // Updates
  const setDictValue = (locale: string, id: string, value: string) => {
    setDicts((prev) => ({ ...prev, [locale]: { ...(prev[locale] || {}), [id]: value } }));
  };
  const updateAgentSettings = (path: string, v: any) => {
    setAgentSettings((prev: any) => {
      const clone = JSON.parse(JSON.stringify(prev ?? {}));
      setByPath(clone, path.replace(/^agentAI\./, ''), v);
      return clone;
    });
  };
  const updateAgentBranding = (path: string, v: any) => {
    setAgentBranding((prev: any) => {
      const clone = JSON.parse(JSON.stringify(prev ?? {}));
      setByPath(clone, path.replace(/^agentAI\./, ''), v);
      return clone;
    });
  };

  // Guardado único
  const onSaveAll = async () => {
    setSaving(true);
    try {
      // 1) settings/default ← { agentAI: ... }
      await saveSettingsClient({ agentAI: agentSettings });

      await Promise.all(LOCALES.map((c) => saveI18n(c.code, dicts[c.code] || {})));

      // 3) branding/default ← { agentAI: ... } (sin FM)
      const agentAI_global = stripFM(agentBranding) as unknown as AgentAISubtree;
      const globalPayload: Partial<BrandingFS> = { agentAI: agentAI_global };
      await saveBrandingGlobal(globalPayload);

    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="opacity-70">Cargando Agente de IA…</div>;

  return (
    <div className="space-y-2 pb-16">
      <h2 className="text-base font-semibold">Agente de IA</h2>

      {/* Parámetros (Settings) */}
      <details open className="rounded-lg border border-[#1f2937] bg-[#0b1220]">
        <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium bg-[#0d1326]">
          Parámetros del agente (Settings)
        </summary>
        <div className="px-3 pb-3 pt-2">
          <FieldSettings
            path={'agentAI'}
            label={'agentAI'}
            value={agentSettings}
            onChange={updateAgentSettings}
          />
        </div>
      </details>

      {/* Contenido (Branding + i18n) */}
      <details open className="rounded-lg border border-[#1f2937] bg-[#0b1220]">
        <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium bg-[#0d1326]">
          Contenido del agente (Branding + i18n)
        </summary>
        <div className="px-3 pb-3 pt-2">
          <FieldBranding
            path={'agentAI'}
            label={'agentAI'}
            value={agentBranding}
            onChange={updateAgentBranding}
            dicts={dicts}
            setDictValue={setDictValue}
          />
        </div>
      </details>

      {/* Guardado único flotante */}
      <div className="fixed bottom-3 right-3 z-50">
        <button
          className="rounded px-4 py-2 bg-[#2563eb] text-white shadow-lg text-sm disabled:opacity-60"
          onClick={onSaveAll}
          disabled={saving}
          title="Guardar settings.agentAI + i18n + branding.agentAI"
        >
          {saving ? 'Guardando…' : 'Guardar todo'}
        </button>
      </div>
    </div>
  );
}
