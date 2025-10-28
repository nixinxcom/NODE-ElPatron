// app/api/paypal/create-order/route.ts
import { NextRequest, NextResponse } from "next/server";
import { paypalCreateOrder } from "@/app/lib/paypal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toOrdersLocale(input?: string) {
  if (!input) return undefined;
  const cleaned = input.replace("_", "-");
  const [langRaw, regionRaw] = cleaned.split("-");
  const lang = (langRaw || "").toLowerCase();
  const region = regionRaw ? regionRaw.toUpperCase() : "";
  const cand = region ? `${lang}-${region}` : "";

  const supported = new Set([
    "en-US","en-GB","fr-FR","fr-CA","es-ES","it-IT","de-DE","pt-BR",
    "zh-CN","zh-HK","zh-TW","ja-JP","nl-NL","pl-PL","ru-RU",
  ]);
  if (cand && supported.has(cand)) return cand;

  const fb: Record<string, string> = {
    es: "es-ES", en: "en-US", fr: "fr-FR", pt: "pt-BR", zh: "zh-CN",
    de: "de-DE", it: "it-IT", nl: "nl-NL", pl: "pl-PL", ru: "ru-RU", ja: "ja-JP",
  };
  return fb[lang] || "en-US";
}

function toAbsolute(req: NextRequest, url?: string) {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  const proto =
    req.headers.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "production" ? "https" : "http");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${proto}://${host}${path}`;
}

export async function POST(req: NextRequest) {
  try {
    const {
      amount,
      currency,
      intent,
      return_url,
      cancel_url,
      locale,
      metadata,
    } = await req.json();

    // amount "2800.00"
    const amountStr = String(amount ?? "").replace(/,/g, "").trim();
    if (!/^\d+(\.\d{1,2})?$/.test(amountStr)) {
      return NextResponse.json({ error: "invalid amount format" }, { status: 400 });
    }

    const currencyCode = String(currency || "CAD").toUpperCase();
    const intentUp = intent === "AUTHORIZE" ? "AUTHORIZE" : "CAPTURE";

    const order = await paypalCreateOrder({
      amount: amountStr,
      currency: currencyCode as "CAD" | "USD",
      intent: intentUp,
      // IMPORTANTES: absolutas y locale con guion
      return_url: toAbsolute(req, return_url),
      cancel_url: toAbsolute(req, cancel_url),
      locale: toOrdersLocale(locale),
      metadata,
    });

    return NextResponse.json({ id: order.id }, { status: 200 });
  } catch (e: any) {
    console.error("[paypal][create-order]", e?.message || e);
    return NextResponse.json({ error: e?.message || "paypal error" }, { status: 400 });
  }
}
