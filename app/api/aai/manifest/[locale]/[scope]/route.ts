// app/api/aai/slices/[locale]/[scope]/route.ts
export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { getSliceServer } from '@/complements/data/aaiSlices';
import { toShortLocale, DEFAULT_LOCALE_SHORT } from '@/app/lib/i18n/locale';

type Params = { locale?: string; scope?: string };

export async function GET(_: Request, ctx:{ params: Promise<Params> }) {
  const p = await ctx.params;
  const locale = toShortLocale(p?.locale ?? DEFAULT_LOCALE_SHORT);
  const scope = p?.scope ?? 'contact';
  const out = await getSliceServer(locale, scope as any);
  return NextResponse.json({ ok:true, locale, scope, ...out }, {
    headers: {
      'Cache-Control': 'public, max-age=60',
      'ETag': out.scope_version,
    }
  });
}
