import "server-only";
import { NextRequest, NextResponse } from "next/server";
import baseSettings from "@/seeds/settings";
import type iSettings from "@/app/lib/settings/interface";
import { hasFaculty, type FacultyKey } from "@/app/lib/faculties";
// import { getTenantIdFromRequest } from "@/app/lib/notifications/tenant";
// y más adelante aquí puedes cargar settings por tenant desde NIXINX.org/Firestore

type Body = {
  topics?: FacultyKey[]; // ej: ["notifications", "agentAI"]
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body;

    // TODO (multi-tenant real):
    // const tenantId = getTenantIdFromRequest(req);
    // const settings = await loadSettingsForTenant(tenantId);
    // Por ahora usamos baseSettings como settings efectivos:
    const settings: iSettings = baseSettings as iSettings;

    const allKeys = Object.keys(settings.faculties || {}) as FacultyKey[];
    const topics: FacultyKey[] =
      body.topics && body.topics.length ? body.topics : allKeys;

    const faculties: Record<FacultyKey, boolean> = {} as any;
    for (const key of topics) {
      faculties[key] = hasFaculty(settings, key);
    }

    return NextResponse.json({ ok: true, faculties });
  } catch (err) {
    console.error("[faculties/check] error", err);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
