// SERVER: inspección del branding efectivo
import { NextResponse } from "next/server";
import { getEffectiveBrandingServer } from "@/app/lib/seo/schema";

export async function GET() {
  try {
    const data = await getEffectiveBrandingServer();
    return NextResponse.json({ ok: true, branding: data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
