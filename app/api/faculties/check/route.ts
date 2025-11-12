// app/api/faculties/check/route.ts
import "server-only";
import { NextRequest, NextResponse } from "next/server";
import baseSettings from "@/seeds/settings";
import type iSettings from "@/app/lib/settings/interface";
import { type FacultyKey } from "@/app/lib/faculties";

/**
 * Aquí es donde, en producción real,
 * el Core va a decidir si un Nodo NX tiene permiso.
 *
 * Hoy: usa baseSettings.
 * Mañana: mira tenantId / clientId -> Firestore / DB de NIXINX.org.
 */

function getEffectiveSettingsForClient(_clientId?: string | null): iSettings {
  // TODO: leer desde NIXINX.org / Firestore según el cliente.
  // Por ahora, baseSettings como si fuera el "plan" del cliente.
  return baseSettings as iSettings;
}

function hasFaculty(settings: iSettings, key: FacultyKey): boolean {
  return !!settings.faculties?.[key];
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      clientId?: string;          // ID del cliente/Nodo NX
      topics?: FacultyKey[];      // facultades a consultar
    };

    const clientId =
      body.clientId ||
      req.headers.get("x-nixinx-client-id") ||
      req.headers.get("x-nixinx-tenant-id") ||
      null;

    const settings = getEffectiveSettingsForClient(clientId);

    const allKeys = Object.keys(settings.faculties || {}) as FacultyKey[];
    const topics =
      body.topics && body.topics.length ? body.topics : allKeys;

    const faculties: Record<FacultyKey, boolean> = {} as any;
    for (const key of topics) {
      faculties[key] = hasFaculty(settings, key);
    }

    return NextResponse.json({
      ok: true,
      clientId,
      faculties,
    });
  } catch (err) {
    console.error("[faculties/check][POST] error", err);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 }
    );
  }
}

// Alternativa GET sencilla: /api/faculties/check?clientId=...&keys=notifications,agentAI
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const clientId =
      url.searchParams.get("clientId") ||
      req.headers.get("x-nixinx-client-id") ||
      req.headers.get("x-nixinx-tenant-id") ||
      null;

    const keysParam = url.searchParams.get("keys") || "";
    const keys = keysParam
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean) as FacultyKey[];

    const settings = getEffectiveSettingsForClient(clientId);
    const allKeys = Object.keys(settings.faculties || {}) as FacultyKey[];
    const topics = keys.length ? keys : allKeys;

    const faculties: Record<string, boolean> = {};
    for (const key of topics) {
      faculties[key] = hasFaculty(settings, key as FacultyKey);
    }

    return NextResponse.json({
      ok: true,
      clientId,
      faculties,
    });
  } catch (err) {
    console.error("[faculties/check][GET] error", err);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 }
    );
  }
}
