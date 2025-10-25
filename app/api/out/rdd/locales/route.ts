// app/api/out/rdd/locales/route.ts
import { NextResponse } from "next/server";
import { DEFAULT_LOCALE_SHORT, toShortLocale, type ShortLocale } from "@/app/lib/i18n/locale";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KNOWN: ShortLocale[] = ["es","en","fr"];

export async function GET() {
  try {
    return NextResponse.json({ ok:true, locales: KNOWN, default: DEFAULT_LOCALE_SHORT });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: String(e?.message||e) }, { status: 500 });
  }
}
