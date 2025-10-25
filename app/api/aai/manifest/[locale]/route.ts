// app/api/aai/manifest/[locale]/route.ts
export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { getManifestServer } from '@/complements/data/aaiSlices';
import { toShortLocale, DEFAULT_LOCALE_SHORT } from '@/app/lib/i18n/locale';

export async function GET(_: Request, ctx: { params: Promise<{locale?:string}> }) {
  const p = await ctx.params;
  const locale = toShortLocale(p?.locale ?? DEFAULT_LOCALE_SHORT);
  const manifest = await getManifestServer(locale);
  return NextResponse.json({ ok:true, locale, manifest });
}
