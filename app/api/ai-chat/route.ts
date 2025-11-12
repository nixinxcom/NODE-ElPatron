// app/api/ai-chat/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';

type Short = 'es' | 'en' | 'fr';
const DEFAULT_LOCALE_SHORT: Short = 'en';

// ---------- Utils ----------
function shortFrom(v?: string | null): Short {
  const x = String(v || '').toLowerCase();
  if (x.startsWith('es')) return 'es';
  if (x.startsWith('fr')) return 'fr';
  return 'en';
}

// Firestore REST → JS plano
function fsValueToJs(v: any): any {
  if (!v || typeof v !== 'object') return v;
  if ('nullValue' in v) return null;
  if ('booleanValue' in v) return Boolean(v.booleanValue);
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('stringValue' in v) return String(v.stringValue);
  if ('timestampValue' in v) return String(v.timestampValue);
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(fsValueToJs);
  if ('mapValue' in v) {
    const out: Record<string, any> = {};
    const f = v.mapValue.fields || {};
    for (const k of Object.keys(f)) out[k] = fsValueToJs(f[k]);
    return out;
  }
  return v;
}

async function fetchBrandingDoc(): Promise<any | null> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) return null;
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/branding/default`;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    const fields = json?.fields || null;
    if (!fields) return null;
    return fsValueToJs({ mapValue: { fields } });
  } catch {
    return null;
  }
}

// ---------- Handler ----------
export async function POST(req: Request) {
  // Headers desde la Request (no uses headers())
  const host = req.headers.get('host') || '';

  const body = await req.json().catch(() => ({} as any));
  const userMsg: string = String(body?.userMessage || body?.message || '').trim();
  if (!userMsg) {
    return NextResponse.json({ ok: false, error: 'empty_message' }, { status: 400 });
  }

  // Locale: body > header > default
  const headerLocale = req.headers.get('x-locale');
  const short: Short =
    (body?.locale ? shortFrom(String(body.locale)) :
    (headerLocale ? shortFrom(headerLocale) : DEFAULT_LOCALE_SHORT));

  // Branding del FS del tenant actual
  const branding = (await fetchBrandingDoc()) || {};

  // Prompt: no inventar, no mezclar tenants; responde en short
  const system = [
    `Eres el asistente del sitio para el dominio "${host}".`,
    `Responde SIEMPRE en "${short}".`,
    `Usa EXCLUSIVAMENTE la información proporcionada en el objeto "branding".`,
    `Si algo no está en "branding", di amablemente que no cuentas con esa información.`,
    `No inventes URLs, productos, precios, promociones o políticas.`,
    `No hables de otros clientes ni compares.`,
    `Sé natural, útil y breve; ofrece ayuda adicional cuando aplique.`
  ].join(' ');

  const context = `branding JSON:\n${JSON.stringify(branding, null, 2)}`;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: 'missing_openai_key' }, { status: 500 });
  }

  const model = process.env.OPENAI_MODEL || 'gpt-5-nano';
  const client = new OpenAI({ apiKey });

  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'system', content: context },
        { role: 'user', content: userMsg }
      ],
    });

    const reply = completion.choices?.[0]?.message?.content?.trim?.() || '';

    return NextResponse.json({ ok: true, reply, locale: short });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
