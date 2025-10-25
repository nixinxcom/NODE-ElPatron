// app/lib/ai/modelCaps.ts
export type TokensKey = 'max_tokens' | 'max_completion_tokens';

type FixedOrRange =
  | { kind: 'range'; min: number; max: number; default?: number }
  | { kind: 'fixed'; value: number }
  | { kind: 'unsupported' };

export interface ModelCaps {
  /** patrón para hacer match con el id del modelo */
  pattern: RegExp;
  /** clave correcta para el límite de salida */
  tokensKey: TokensKey;
  /** sampling y penalizaciones permitidas */
  temperature: FixedOrRange;
  top_p: FixedOrRange;
  frequency_penalty: FixedOrRange;
  presence_penalty: FixedOrRange;
  /** notas opcionales */
  notes?: string;
}

/**
 * Catálogo de capacidades por familia.
 * Ajusta/añade entradas si tu flota de modelos cambia.
 */
export const MODEL_CAPS: ModelCaps[] = [
  {
    // p. ej. "gpt-5-nano", "xxx-nano"
    pattern: /nano/i,
    tokensKey: 'max_completion_tokens',
    temperature: { kind: 'fixed', value: 1 },          // solo valor por defecto
    top_p: { kind: 'fixed', value: 1 },                // solo valor por defecto
    frequency_penalty: { kind: 'unsupported' },
    presence_penalty: { kind: 'unsupported' },
    notes: 'Nano: sampling fijo; no admite penalties; usa max_completion_tokens.',
  },
  {
    // p. ej. "gpt-4o-mini"
    pattern: /mini/i,
    tokensKey: 'max_completion_tokens',
    temperature: { kind: 'range', min: 0, max: 2, default: 1 },
    top_p: { kind: 'range', min: 0, max: 1, default: 1 },
    frequency_penalty: { kind: 'range', min: -2, max: 2, default: 0 },
    presence_penalty: { kind: 'range', min: -2, max: 2, default: 0 },
    notes: 'Mini: sampling configurable; usa max_completion_tokens.',
  },
  {
    // p. ej. "gpt-4o", "gpt-4o-2024-xx"
    pattern: /^gpt-4o($|[-.])/i,
    tokensKey: 'max_tokens',
    temperature: { kind: 'range', min: 0, max: 2, default: 1 },
    top_p: { kind: 'range', min: 0, max: 1, default: 1 },
    frequency_penalty: { kind: 'range', min: -2, max: 2, default: 0 },
    presence_penalty: { kind: 'range', min: -2, max: 2, default: 0 },
    notes: '4o: usa max_tokens.',
  },
  {
    // Fallback conservador para modelos no catalogados
    pattern: /.*/,
    tokensKey: 'max_tokens',
    temperature: { kind: 'range', min: 0, max: 2, default: 1 },
    top_p: { kind: 'range', min: 0, max: 1, default: 1 },
    frequency_penalty: { kind: 'range', min: -2, max: 2, default: 0 },
    presence_penalty: { kind: 'range', min: -2, max: 2, default: 0 },
    notes: 'Fallback genérico.',
  },
];

export type ChatOptions = {
  model: string;
  messages: { role: 'system'|'user'|'assistant'; content: string }[];
  max_tokens: number;
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
};

/** Clampa y/o descarta parámetros según las capacidades del modelo. */
export function buildChatPayload(opts: ChatOptions) {
  const caps = MODEL_CAPS.find(c => c.pattern.test(opts.model))!;
  const payload: any = { model: opts.model, messages: opts.messages };
  const warnings: string[] = [];

  // tokens key
  if (caps.tokensKey === 'max_completion_tokens') {
    payload.max_completion_tokens = opts.max_tokens;
  } else {
    payload.max_tokens = opts.max_tokens;
  }

  const apply = (
    name: 'temperature'|'top_p'|'frequency_penalty'|'presence_penalty',
    value: number | undefined
  ) => {
    const rule = (caps as any)[name] as FixedOrRange;
    if (!rule || rule.kind === 'unsupported') {
      if (value !== undefined) warnings.push(`${name} ignorado (no soportado por ${opts.model})`);
      return;
    }
    if (rule.kind === 'fixed') {
      if (value !== undefined && value !== rule.value) {
        warnings.push(`${name}=${value} → ${rule.value} (valor fijo en ${opts.model})`);
      }
      payload[name] = rule.value;
      return;
    }
    // range
    const v = value === undefined ? rule.default ?? undefined : value;
    if (v === undefined) return;
    let clamped = v;
    if (clamped < rule.min) { clamped = rule.min; warnings.push(`${name} clamped → ${rule.min}`); }
    if (clamped > rule.max) { clamped = rule.max; warnings.push(`${name} clamped → ${rule.max}`); }
    payload[name] = clamped;
  };

  apply('temperature', opts.temperature);
  apply('top_p', opts.top_p);
  apply('frequency_penalty', opts.frequency_penalty);
  apply('presence_penalty', opts.presence_penalty);

  return { payload, warnings, caps };
}
