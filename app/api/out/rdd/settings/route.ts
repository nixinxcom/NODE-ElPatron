// app/api/out/rdd/settings/route.ts
import "server-only";
import { NextResponse } from "next/server";
import { getSettingsEffective } from "@/complements/data/settingsFS";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getSettingsEffective();
    return NextResponse.json({ ok:true, settings, updatedAt: new Date().toISOString() });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: String(e?.message||e) }, { status: 500 });
  }
}
