import { NextResponse } from 'next/server';
import { getBssEffectiveCached } from '@/app/lib/bss/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const locale = url.searchParams.get('locale') ?? '';
  try {
    const data = await getBssEffectiveCached(locale);
    return NextResponse.json({ ok: true, locale, ...data }, {
      // cache en CDN si quieres
      headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' }
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
