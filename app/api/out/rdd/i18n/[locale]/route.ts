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
  const q = (params?.locale || url.searchParams.get("locale") || DEFAULT_LOCALE_SHORT).trim();
  const locale = toShortLocale(q);

  const dict = await getI18nEffectiveServer(locale);

  return Response.json({
    ok: true,
    locale,
    dict,
    updatedAt: new Date().toISOString(),
  });
}
