import { NextResponse } from "next/server";
import { createOrder } from "@/app/lib/paypal";
import { toPayPalLocale } from "@/app/lib/i18n/adapters";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { amount, currency = "CAD", userId = null, locale: bodyLocale } = body || {};

    if (!amount) {
      return NextResponse.json({ error: "amount required" }, { status: 400 });
    }

    // Fuente de verdad de locale (body → headers → env)
    const headerLocale = req.headers.get("x-locale") || req.headers.get("accept-language");
    const payPalLocale = toPayPalLocale(bodyLocale || headerLocale || undefined);

    // Pasa locale + customId a la capa de PayPal
    const order = await createOrder(String(amount), currency, {
      customId: userId ?? null,
      locale: payPalLocale,
    });

    return NextResponse.json({ id: order.id, order });
  } catch (e: any) {
    console.error("create-order error:", e);
    return NextResponse.json({ error: e?.message ?? "create failed" }, { status: 500 });
  }
}

/* ─────────────────────────────────────────────────────────
DOC: API POST /api/paypal/create-order  (app/api/paypal/create-order/route.ts)
QUÉ HACE:
  Crea una orden de PayPal (Orders v2) en el servidor y devuelve el orderId y la URL
  para aprobar el pago (approveUrl). Por defecto usa intent 'CAPTURE'. Soporta idempotencia
  para evitar órdenes duplicadas y mapea la respuesta a un shape estable para tu frontend.

MÉTODO Y RUTA:
  POST /api/paypal/create-order

REQUEST (JSON esperado):
  type CreateOrderBody = {
    amount: { value: string; currency_code?: 'CAD'|'USD'|'EUR' }  // requerido | monto total; currency opcional | default 'CAD'
    intent?: 'CAPTURE' | 'AUTHORIZE'                              // opcional | default 'CAPTURE'
    referenceId?: string                                          // opcional | referencia propia (p. ej., bookingTempId)
    items?: Array<{                                               // opcional | desglosado de ítems (se suman al total)
      name: string                                                // requerido si se envía items
      unit_amount: { value: string; currency_code?: 'CAD' }       // requerido | currency opcional | default 'CAD'
      quantity: string                                            // requerido | entero como string
      category?: 'DIGITAL_GOODS' | 'PHYSICAL_GOODS'               // opcional
    }>
    locale?: 'es-ES'|'en-CA'|'fr-CA'|'es-419'                     // opcional | experiencia de checkout
    noShipping?: boolean                                          // opcional | si true, shipping_preference = 'NO_SHIPPING'
    returnUrl?: string                                            // opcional | override; default desde env
    cancelUrl?: string                                            // opcional | override; default desde env
    brandName?: string                                            // opcional | override; default desde env
    idempotencyKey?: string                                       // opcional | para PayPal-Request-Id
    debug?: boolean                                               // opcional | default false | incluye 'raw' en la respuesta
  }

EJEMPLO DE USO (fetch desde cliente o SSR):
  await fetch('/api/paypal/create-order', {
    method: 'POST',                                // requerido | 'POST'
    headers: { 'Content-Type': 'application/json' }, // requerido
    body: JSON.stringify({
      amount: { value: '12.00', currency_code: 'CAD' }, // requerido | string decimal; currency opcional | 'CAD' por default
      intent: 'CAPTURE',                           // opcional | 'CAPTURE'|'AUTHORIZE' | default 'CAPTURE'
      referenceId: 'booking-temp-123',            // opcional | string
      items: [                                    // opcional | array de ítems
        { name: 'Depósito reserva', unit_amount: { value: '12.00', currency_code: 'CAD' }, quantity: '1' } // requerido si items
      ],
      locale: 'en-CA',                            // opcional | 'es-ES'|'en-CA'|'fr-CA'|'es-419'
      noShipping: true,                           // opcional | boolean | si true, sin dirección
      idempotencyKey: 'create-12.00-123',         // opcional | string (recomendado)
      debug: false                                // opcional | boolean | default false
    })
  })

RESPUESTA 200 (shape sugerido):
  type CreateOrderResponse = {
    ok: boolean                                   // true si la creación fue exitosa
    status: 'created' | 'already_exists' | 'error'// estado de negocio
    orderId?: string                              // presente si ok
    approveUrl?: string                           // URL a la que debes redirigir al comprador
    amount?: { value: string; currency_code: string } // eco del total
    details?: string                              // mensaje corto (errores o notas)
    raw?: unknown                                 // payload crudo de PayPal si debug=true
  }

CÓDIGOS DE ESTADO COMUNES:
  200  Ok: 'created' o 'already_exists'
  400  Bad Request: body inválido o falta amount.value
  409  Conflict: idempotencyKey ya usado con otro payload
  500  Error del servidor o de PayPal

INTEGRACIÓN CON PAYPAL (resumen de esta route):
  1) Obtener access token con Client ID y Secret (OAuth2)
     POST /v1/oauth2/token (grant_type=client_credentials) usando Basic Auth (client:secret)
  2) Crear la orden:
     POST /v2/checkout/orders
     Body mínimo:
       {
         intent: 'CAPTURE',
         purchase_units: [{
           reference_id: referenceId,
           amount: { currency_code, value },
           items // si se envía, deben cuadrar con amount
         }],
         application_context: {
           return_url: returnUrl,
           cancel_url: cancelUrl,
           brand_name: brandName,
           shipping_preference: noShipping ? 'NO_SHIPPING' : 'GET_FROM_FILE',
           user_action: 'PAY_NOW',
           locale: locale
         }
       }
     Headers recomendados:
       Authorization: Bearer <access_token>
       PayPal-Request-Id: <idempotencyKey>               // opcional | idempotencia
       Content-Type: application/json
  3) Extraer approveUrl del array links (rel = 'approve') y devolver orderId + approveUrl.

ENTORNO / VARIABLES RECOMENDADAS:
  PAYPAL_CLIENT_ID            // requerido | Client ID (sandbox/live)
  PAYPAL_CLIENT_SECRET        // requerido | Secret
  PAYPAL_ENV=sandbox|live     // opcional | default 'sandbox'
  PAYPAL_API_BASE             // opcional | override; sandbox: https://api-m.sandbox.paypal.com
  PAYPAL_RETURN_URL           // recomendado | fallback para application_context.return_url
  PAYPAL_CANCEL_URL           // recomendado | fallback para application_context.cancel_url
  PAYPAL_BRAND_NAME           // opcional | nombre que verá el comprador

SEGURIDAD Y VALIDACIONES:
  - Nunca expongas Client Secret en cliente; todo en servidor.
  - Valida amount.value como string decimal positivo y, si mandas items, que la suma cuadre.
  - Usa idempotencyKey estable (p. ej., hash de referenceId+amount) para reintentos seguros.
  - Considera CSRF si esta API puede ser llamada desde navegadores externos.

WEBHOOKS RECOMENDADOS:
  - CHECKOUT.ORDER.APPROVED        // el comprador aprobó; listo para capturar
  - PAYMENT.CAPTURE.COMPLETED      // tras captura (si usas intent 'CAPTURE')
  - PAYMENT.AUTHORIZATION.CREATED  // si usas intent 'AUTHORIZE'

CHECKLIST RÁPIDO:
  - Validar body: amount.value requerido; currency opcional con default.
  - Construir purchase_units consistente con items (si existen).
  - application_context con return/cancel y shipping_preference.
  - Parsear links para obtener approveUrl.
  - Registrar en DB: orderId, referenceId, amount, currency y timestamps.
────────────────────────────────────────────────────────── */
