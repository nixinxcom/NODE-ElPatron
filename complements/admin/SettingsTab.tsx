'use client';

import React from 'react';
import type iSettings from '@/app/lib/settings/interface';
// Carga por regla (FS > TSX(FM) > JSON > TSX). En settings normalmente no hay FM, pero respetamos el orden.
import { getSettingsEffectiveForUI } from '@/complements/data/ruleUI';
import { saveSettingsClient } from '@/app/lib/settings/client';       // writer a FS
import { Button, Link, NextImage, Image, Div, A, P, H1, H2, H3, H4, H5, H6, Label } from "@/complements/components/ui/wrappers";

// ----------------- helpers -----------------
const setByPath = (obj: any, path: string, value: any) => {
  const parts = path.split('.');
  const last = parts.pop()!;
  const target = parts.reduce((acc, k) => (acc[k] ??= {}), obj);
  target[last] = value;
  return obj;
};

const SECTION_LABELS: Record<string, string> = {
  website: 'Sitio web',
  company: 'Empresa',
  pwa: 'Manifiesto PWA',
  agentAI: 'Agente de IA',
  directUrls: 'URLs directas',
  domain: 'Dominio',
  faculties: 'Facultades',
};

type ArrKind = 'string' | 'number' | 'boolean' | 'object' | 'mixed' | 'unknown';

const kindOf = (v: any): ArrKind =>
  Array.isArray(v) ? 'unknown'
  : v === null ? 'mixed'
  : typeof v === 'object' ? 'object'
  : (typeof v as ArrKind);

// ----------------- Array editor -----------------
function ArrayField({
  path,
  label,
  value,
  onChange,
}: {
  path: string;
  label?: string;
  value: any[];
  onChange: (path: string, v: any[]) => void;
}) {
  // inferir tipo global si todos coinciden
  const itemKinds = value.map(kindOf);
  const uniform =
    itemKinds.length > 0 && itemKinds.every((k) => k === itemKinds[0])
      ? (itemKinds[0] as ArrKind)
      : (itemKinds.length ? 'mixed' : 'unknown');

  const [emptyKind, setEmptyKind] = React.useState<ArrKind>('string');

  const addItem = (k: ArrKind) => {
    const next = [...value];
    switch (k) {
      case 'string': next.push(''); break;
      case 'number': next.push(0); break;
      case 'boolean': next.push(false); break;
      case 'object': next.push({}); break;
      default: next.push(''); break;
    }
    onChange(path, next);
  };

  const removeItem = (i: number) => {
    const next = value.slice();
    next.splice(i, 1);
    onChange(path, next);
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = value.slice();
    const tmp = next[i];
    next[i] = next[j];
    next[j] = tmp;
    onChange(path, next);
  };

  const updateItem = (i: number, newVal: any) => {
    const next = value.slice();
    next[i] = newVal;
    onChange(path, next);
  };

  return (
    <fieldset className="rounded-2xl border border-[#1f2937] px-4 py-3 my-3">
      <legend className="px-2 text-sm opacity-80">{label ?? path}</legend>

      {/* Array vacío: selector de tipo para primer ítem */}
      {value.length === 0 ? (
        <div className="flex items-center gap-3 py-2">
          <span className="opacity-80">Tipo de elementos:</span>
          <select
            className="rounded-lg px-3 py-2 bg-[#0f172a] border border-[#1f2937]"
            value={emptyKind}
            onChange={(e) => setEmptyKind(e.target.value as ArrKind)}
          >
            <option value="string">Texto</option>
            <option value="number">Número</option>
            <option value="boolean">Booleano</option>
            <option value="object">Objeto</option>
          </select>
          <button
            className="rounded-lg px-3 py-2 bg-[#2563eb] text-white"
            onClick={() => addItem(emptyKind)}
            type="button"
          >
            Añadir elemento
          </button>
        </div>
      ) : (
        <>
          {/* Lista de elementos */}
          <div className="flex flex-col gap-3">
            {value.map((item, i) => {
              const k = kindOf(item);
              const id = `${path}-${i}`;

              if (k === 'string') {
                return (
                  <div key={id} className="flex items-center gap-2">
                    <span className="text-sm opacity-70 w-14">#{i + 1}</span>
                    <input
                      type="text"
                      className="flex-1 rounded-xl px-3 py-2 bg-[#0f172a] border border-[#1f2937]"
                      value={item as string}
                      onChange={(e) => updateItem(i, e.target.value)}
                    />
                    <div className="flex gap-1">
                      <button className="px-2 py-1 rounded bg-[#111827]" onClick={() => move(i, -1)} type="button">↑</button>
                      <button className="px-2 py-1 rounded bg-[#111827]" onClick={() => move(i, +1)} type="button">↓</button>
                      <button className="px-2 py-1 rounded bg-[#7f1d1d] text-white" onClick={() => removeItem(i)} type="button">✕</button>
                    </div>
                  </div>
                );
              }

              if (k === 'number') {
                return (
                  <div key={id} className="flex items-center gap-2">
                    <span className="text-sm opacity-70 w-14">#{i + 1}</span>
                    <input
                      type="number"
                      className="flex-1 rounded-xl px-3 py-2 bg-[#0f172a] border border-[#1f2937]"
                      value={item as number}
                      onChange={(e) => updateItem(i, Number(e.target.value))}
                    />
                    <div className="flex gap-1">
                      <button className="px-2 py-1 rounded bg-[#111827]" onClick={() => move(i, -1)} type="button">↑</button>
                      <button className="px-2 py-1 rounded bg-[#111827]" onClick={() => move(i, +1)} type="button">↓</button>
                      <button className="px-2 py-1 rounded bg-[#7f1d1d] text-white" onClick={() => removeItem(i)} type="button">✕</button>
                    </div>
                  </div>
                );
              }

              if (k === 'boolean') {
                return (
                  <div key={id} className="flex items-center gap-2">
                    <span className="text-sm opacity-70 w-14">#{i + 1}</span>
                    <Label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!item}
                        onChange={(e) => updateItem(i, e.target.checked)}
                      />
                      <span>Activo</span>
                    </Label>
                    <div className="flex gap-1 ml-auto">
                      <button className="px-2 py-1 rounded bg-[#111827]" onClick={() => move(i, -1)} type="button">↑</button>
                      <button className="px-2 py-1 rounded bg-[#111827]" onClick={() => move(i, +1)} type="button">↓</button>
                      <button className="px-2 py-1 rounded bg-[#7f1d1d] text-white" onClick={() => removeItem(i)} type="button">✕</button>
                    </div>
                  </div>
                );
              }

              // objeto o mixto: render recursivo por item
              return (
                <div key={id} className="rounded-xl border border-[#1f2937] p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm opacity-70">Elemento #{i + 1}</span>
                    <div className="flex gap-1">
                      <button className="px-2 py-1 rounded bg-[#111827]" onClick={() => move(i, -1)} type="button">↑</button>
                      <button className="px-2 py-1 rounded bg-[#111827]" onClick={() => move(i, +1)} type="button">↓</button>
                      <button className="px-2 py-1 rounded bg-[#7f1d1d] text-white" onClick={() => removeItem(i)} type="button">✕</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.keys(item || {}).map((subKey) => (
                      <Field
                        key={`${id}-${subKey}`}
                        path={`${path}.${i}.${subKey}`}
                        label={subKey}
                        value={(item as any)[subKey]}
                        onChange={(p, v) => {
                          // delega al padre a través de onChange con setByPath
                          // lo maneja el Field principal
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2 mt-3">
            <span className="opacity-70">Añadir elemento</span>
            <button className="px-3 py-2 rounded bg-[#2563eb] text-white" onClick={() => addItem(uniform === 'unknown' || uniform === 'mixed' ? 'string' : uniform)} type="button">
              + {uniform === 'unknown' || uniform === 'mixed' ? 'Texto' : uniform}
            </button>
            {(uniform === 'unknown' || uniform === 'mixed') && (
              <>
                <button className="px-3 py-2 rounded bg-[#111827]" onClick={() => addItem('number')} type="button">+ Número</button>
                <button className="px-3 py-2 rounded bg-[#111827]" onClick={() => addItem('boolean')} type="button">+ Booleano</button>
                <button className="px-3 py-2 rounded bg-[#111827]" onClick={() => addItem('object')} type="button">+ Objeto</button>
              </>
            )}
          </div>
        </>
      )}
    </fieldset>
  );
}

// ----------------- Field genérico -----------------
function Field({
  path,
  value,
  label,
  onChange,
}: {
  path: string;
  value: any;
  label?: string;
  onChange: (path: string, v: any) => void;
}) {
  const id = `fld-${path.replace(/\./g, '-')}`;

  if (typeof value === 'boolean') {
    return (
      <Label className="flex items-center gap-2 py-2">
        <input
          id={id}
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(path, e.target.checked)}
        />
        <span>{label ?? path}</span>
      </Label>
    );
  }

  if (typeof value === 'number') {
    return (
      <div className="flex flex-col gap-1 py-2">
        <Label htmlFor={id}>{label ?? path}</Label>
        <input
          id={id}
          type="number"
          className="rounded-xl px-3 py-2 bg-[#0f172a] border border-[#1f2937] w-full"
          value={value}
          onChange={(e) => onChange(path, Number(e.target.value))}
        />
      </div>
    );
  }

  if (typeof value === 'string') {
    return (
      <div className="flex flex-col gap-1 py-2">
        <Label htmlFor={id}>{label ?? path}</Label>
        <input
          id={id}
          type="text"
          className="rounded-xl px-3 py-2 bg-[#0f172a] border border-[#1f2937] w-full"
          value={value}
          onChange={(e) => onChange(path, e.target.value)}
        />
      </div>
    );
  }

  if (Array.isArray(value)) {
    return (
      <ArrayField
        path={path}
        label={label}
        value={value}
        onChange={(p, v) => onChange(p, v)}
      />
    );
  }

  if (value && typeof value === 'object') {
    return (
      <fieldset className="rounded-2xl border border-[#1f2937] px-4 py-3 my-3">
        <legend className="px-2 text-sm opacity-80">{label ?? path}</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.keys(value).map((k) => (
            <Field
              key={k}
              path={`${path}.${k}`}
              label={k}
              value={(value as any)[k]}
              onChange={onChange}
            />
          ))}
        </div>
      </fieldset>
    );
  }

  return (
    <div className="flex flex-col gap-1 py-2">
      <Label htmlFor={id}>{label ?? path} (JSON)</Label>
      <textarea
        id={id}
        className="rounded-xl px-3 py-2 bg-[#0f172a] border border-[#1f2937] min-h-24"
        value={JSON.stringify(value ?? null, null, 2)}
        onChange={(e) => {
          try { onChange(path, JSON.parse(e.target.value)); } catch {}
        }}
      />
    </div>
  );
}

// ----------------- Page -----------------
export default function SettingsTab() {
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<iSettings | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [open, setOpen] = React.useState<Record<string, boolean>>({});

  // NUEVO: vista previa por regla (para validar que respeta FS > TSX(FM) > JSON > TSX)
  const [previewProv, setPreviewProv] = React.useState<any | null>(null);
  const [showPreview, setShowPreview] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      // Carga por regla exacta (en settings normalmente == FS > JSON > TSX)
      const { effective, provenance } = await getSettingsEffectiveForUI();
      setData(effective as iSettings);
      setPreviewProv(provenance);
      const defaults: Record<string, boolean> = {};
      Object.keys(effective || {}).forEach((k) => (defaults[k] = true));
      setOpen(defaults);
      setLoading(false);
    })();
  }, []);

  const handleChange = (path: string, v: any) => {
    setData((prev) => {
      const clone = JSON.parse(JSON.stringify(prev ?? {}));
      setByPath(clone, path, v);
      return clone;
    });
  };

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    try {
      await saveSettingsClient(data);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !data) return <div className="opacity-70">Cargando…</div>;

  const topLevelKeys = Object.keys(data);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <H1 className="text-2xl font-semibold">Configuración (Manifiesto PWA)</H1>
        <button
          type="button"
          className="ml-auto rounded px-3 py-1 text-sm border border-[#1f2937] bg-[#0d1326]"
          onClick={() => setShowPreview(v => !v)}
        >
          {showPreview ? 'Ocultar vista previa' : 'Ver provenance efectivo'}
        </button>
      </div>

      {showPreview && (
        <details open className="rounded-lg border border-[#1f2937] bg-[#0b1220]">
          <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium bg-[#0d1326]">
            Vista previa (provenance) — Regla: FS &gt; TSX(FM) &gt; JSON &gt; TSX
          </summary>
          <div className="px-4 pb-4 pt-2">
            <pre className="whitespace-pre-wrap text-[11px] opacity-80">
{JSON.stringify(previewProv ?? {}, null, 2)}
            </pre>
          </div>
        </details>
      )}

      {topLevelKeys.map((k) => {
        const label = SECTION_LABELS[k] ?? k;
        const sectionValue = (data as any)[k];
        const isOpen = !!open[k];

        return (
          <details
            key={k}
            open={isOpen}
            onToggle={(e) =>
              setOpen((prev) => ({ ...prev, [k]: (e.target as HTMLDetailsElement).open }))
            }
            className="rounded-2xl border border-[#1f2937] bg-[#0b1220] overflow-hidden"
          >
            <summary className="cursor-pointer select-none px-4 py-3 text-lg font-medium bg-[#0d1326]">
              {label}
            </summary>
            <div className="px-4 pb-4 pt-2">
              <Field path={k} value={sectionValue} label={label} onChange={handleChange} />
            </div>
          </details>
        );
      })}

      <div className="flex gap-3">
        <button
          className="rounded-xl px-4 py-2 bg-[#2563eb] text-white disabled:opacity-50"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}
