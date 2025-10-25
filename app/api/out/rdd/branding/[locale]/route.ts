// app/api/out/rdd/branding/[locale]/route.ts
import "server-only";
import { getBrandingEffectivePWA } from "@/complements/data/brandingFS";
import { toShortLocale, DEFAULT_LOCALE_SHORT } from "@/app/lib/i18n/locale";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: any) {
  // En algunas versiones, ctx.params puede ser una Promesa.
  const maybeParams = ctx?.params;
  const params = typeof maybeParams?.then === "function" ? await maybeParams : maybeParams;

  const url = new URL(req.url);
  const q = (params?.locale || url.searchParams.get("locale") || DEFAULT_LOCALE_SHORT).trim();
  const locale = toShortLocale(q);

  const branding = await getBrandingEffectivePWA(locale);

  return Response.json({
    ok: true,
    locale,
    branding,
    updatedAt: new Date().toISOString(),
  });
}
