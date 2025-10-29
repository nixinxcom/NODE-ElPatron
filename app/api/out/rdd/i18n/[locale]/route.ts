// app/api/out/rdd/i18n/[locale]/route.ts
import "server-only";
import { getI18nEffectiveServer } from "@/complements/data/i18nFS.server";
import { toShortLocale, DEFAULT_LOCALE_SHORT } from "@/app/lib/i18n/locale";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: any) {
  const maybeParams = ctx?.params;
  const params = typeof maybeParams?.then === "function" ? await maybeParams : maybeParams;

  const url = new URL(req.url);

  // Permite corto o largo (p.ej. "es" o "es-MX")
  const localeInput = (params?.locale || url.searchParams.get("locale") || DEFAULT_LOCALE_SHORT).trim();
  const localeShort = toShortLocale(localeInput);

  // Tenant por query (?tenant=elpatronbarandgrill)
  const tenant = (url.searchParams.get("tenant") || "").trim().toLowerCase() || undefined;

  // Pasa el locale *tal cual* (corto o largo) para que el loader pueda resolver ambos
  const dict = await getI18nEffectiveServer(localeInput, tenant);

  return Response.json({
    ok: true,
    locale: localeShort,      // mantenemos salida corta como antes
    tenant: tenant ?? null,   // añadimos visibilidad del tenant
    dict,
    updatedAt: new Date().toISOString(),
  });
}
