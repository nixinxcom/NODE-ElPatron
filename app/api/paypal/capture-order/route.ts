// app/api/paypal/capture-order/route.ts
import { NextRequest, NextResponse } from "next/server";
import { paypalCaptureOrder } from "@/app/lib/paypal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { orderId, metadata } = await req.json();
    if (!orderId) {
      return NextResponse.json({ error: "orderId required" }, { status: 400 });
    }

    const capture = await paypalCaptureOrder(orderId);

    // ---- persistencia opcional (solo si existe algo exportado) ----
    try {
      const mod: any = await import("@/app/lib/payments"); // si no existe, no rompe
      const save =
        mod?.savePayment ||
        mod?.upsertPayment ||
        mod?.createPayment ||
        mod?.default;
      if (typeof save === "function") {
        const cap =
          capture?.purchase_units?.[0]?.payments?.captures?.[0] ?? null;
        await save({
          provider: "paypal",
          id: cap?.id || capture?.id || orderId,
          orderId,
          status: cap?.status || capture?.status,
          amount: cap?.amount?.value,
          currency: cap?.amount?.currency_code,
          metadata,
          raw: capture,
        });
      }
    } catch {
      // sin persistencia; continuar sin fallar el flujo de pago
    }
    // ---------------------------------------------------------------

    return NextResponse.json(capture, { status: 200 });
  } catch (e: any) {
    console.error("[paypal][capture-order]", e?.message || e);
    return NextResponse.json(
      { error: e?.message || "paypal error" },
      { status: 400 }
    );
  }
}
