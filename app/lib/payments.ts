import { db, FieldValue } from '@/app/lib/firebaseAdmin';

// Normaliza montos: Stripe reporta en minor units (p.ej. cents)
function centsToMajor(v?: number | null) {
  if (typeof v !== 'number') return null;
  return Math.round(v) / 100;
}

type SaveExtra = { userId?: string | null; orderId?: string | null };

export async function saveStripePaymentByPI(pi: any, extra: SaveExtra = {}) {
  const paymentIntentId = pi?.id ?? 'unknown';
  const ref = db.collection('payments').doc(paymentIntentId);

  const charge = pi?.charges?.data?.[0] ?? null;
  const amountMinor = pi?.amount_received ?? pi?.amount ?? null;
  const currency = (pi?.currency ?? charge?.currency ?? '').toUpperCase() || null;

  const data = {
    provider: 'stripe',
    type: 'payment_intent',
    paymentIntentId,
    chargeId: charge?.id ?? null,
    status: pi?.status ?? charge?.status ?? null,          // 'succeeded', etc.
    amount_minor: amountMinor,
    amount: centsToMajor(amountMinor),
    currency,
    customerId: (pi?.customer ?? charge?.customer) ?? null,
    email: pi?.receipt_email ?? charge?.billing_details?.email ?? null,
    orderId: extra.orderId ?? null,
    userId: extra.userId ?? null,
    raw: pi,
    updatedAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),               // idempotente: merge no lo sobreescribe con serverTimestamp previo
  };

  await ref.set(data, { merge: true });
  return paymentIntentId;
}

export async function saveStripePaymentFromSession(session: any, extra: SaveExtra = {}) {
  const piId = session?.payment_intent ?? null;
  if (!piId) {
    // Sin PI: guarda por sessionId para no perder el rastro
    const ref = db.collection('payments').doc(session?.id ?? `sess_${Date.now()}`);
    await ref.set({
      provider: 'stripe',
      type: 'checkout_session',
      checkoutSessionId: session?.id ?? null,
      status: session?.payment_status ?? session?.status ?? null, // 'paid', etc.
      amount_minor: session?.amount_total ?? null,
      amount: centsToMajor(session?.amount_total),
      currency: (session?.currency ?? '').toUpperCase() || null,
      customerId: session?.customer ?? null,
      email: session?.customer_details?.email ?? null,
      orderId: extra.orderId ?? null,
      userId: extra.userId ?? null,
      raw: session,
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    return session?.id ?? null;
  }
  // Si hay PI, mejor guardamos por PI (canónico)
  return saveStripePaymentByPI(
    {
      id: piId,
      status: session?.payment_status === 'paid' ? 'succeeded' : session?.payment_status,
      amount_received: session?.amount_total,
      currency: session?.currency,
      customer: session?.customer,
      receipt_email: session?.customer_details?.email,
      charges: { data: [] }, // opcional; evitamos llamar API si no hace falta
    },
    extra,
  );
}

export async function savePayPalCapture(capture: any, extra: SaveExtra = {}) {
  const captureId = capture?.id ?? 'unknown';
  const ref = db.collection('payments').doc(captureId);

  const data = {
    provider: 'paypal',
    captureId,
    orderId:
      extra.orderId ??
      capture?.supplementary_data?.related_ids?.order_id ??
      null,
    status: capture?.status ?? null,                      // e.g. COMPLETED
    amount: capture?.amount?.value ?? null,
    currency: capture?.amount?.currency_code ?? null,
    payer:
      capture?.payer ?? {
        payer_id: capture?.seller_receivable_breakdown?.net_amount?.payer_id ?? null,
      },
    receipt: capture?.links ?? null,                      // links útiles
    raw: capture,                                         // payload completo
    userId: extra.userId ?? null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await ref.set(data, { merge: true });
  return captureId;
}

export async function logPayPalWebhook(event: any) {
  const id = event?.id ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const ref = db.collection('paypal_webhooks').doc(id);
  await ref.set(
    {
      eventId: id,
      type: event?.event_type ?? null,
      resourceId: event?.resource?.id ?? null,
      summary: event?.summary ?? null,
      receivedAt: FieldValue.serverTimestamp(),
      raw: event,
    },
    { merge: true }
  );
}

export function extractFirstCapture(orderOrCapture: any) {
  // /v2/checkout/orders/{id}/capture devuelve un "Order" con captures anidadas
  const cap =
    orderOrCapture?.purchase_units?.[0]?.payments?.captures?.[0] ?? null;
  return cap || orderOrCapture;
}

/* ─────────────────────────────────────────────────────────
DOC: Utilidades de pagos (Stripe/PayPal) — app/lib/payments.ts
QUÉ HACE:
  Centraliza tipos y funciones helper para iniciar y capturar pagos a través de las API internas
  del proyecto (Next API Routes). Expone wrappers fetch idempotentes hacia:
  — /api/stripe/create-order  · /api/stripe/capture-order
  — /api/paypal/create-order  · /api/paypal/capture-order
  Estandariza contratos (input/output), moneda y manejo de errores para UI/flows de checkout.

API / EXPORTS / RUTA:
  — Tipos:
    type Currency = "CAD" | "USD";                                   // valores permitidos | default: "CAD"
    interface LineItem { id:string; name:string; qty:number; unitAmount:number } // unitAmount en centavos
    interface CreatePaymentInput {
      amount: number;          // requerido | centavos (int) | >0
      currency?: Currency;     // opcional  | "CAD"|"USD"    | default: "CAD"
      items?: LineItem[];      // opcional  | —
      metadata?: Record<string,string>; // opcional | claves simples
      captureMethod?: "automatic" | "manual"; // opcional | Stripe | default: "automatic"
      returnUrl?: string;      // opcional  | PayPal approve flow
      cancelUrl?: string;      // opcional  | PayPal approve flow
    }
    interface CreateStripeResult { clientSecret:string; paymentIntentId:string; amount:number; currency:Currency; status:string }
    interface CaptureStripeResult { paymentIntentId:string; status:string }
    interface CreatePayPalResult { id:string; status:"CREATED"; approveUrl:string }
    interface CapturePayPalResult { id:string; status:"COMPLETED" | string }

  — Funciones:
    async function createStripePayment(input: CreatePaymentInput): Promise<CreateStripeResult>
      • POST → /api/stripe/create-order con { amount, currency, items?, metadata?, captureMethod? }
      • Devuelve clientSecret para confirmar en cliente con @stripe/stripe-js.

    async function captureStripePayment(paymentIntentId: string): Promise<CaptureStripeResult>
      • POST → /api/stripe/capture-order con { paymentIntentId }

    async function createPayPalOrder(input: CreatePaymentInput): Promise<CreatePayPalResult>
      • POST → /api/paypal/create-order con { amount, currency, items?, returnUrl?, cancelUrl?, metadata? }
      • Devuelve id y approveUrl para redirigir al flujo de aprobación de PayPal.

    async function capturePayPalOrder(orderId: string): Promise<CapturePayPalResult>
      • POST → /api/paypal/capture-order con { orderId }

USO (ejemplo completo):
  // Tipo | opcional | valores permitidos | default
  import {
    createStripePayment, captureStripePayment,
    createPayPalOrder,  capturePayPalOrder
  } from "@/app/lib/payments";

  // Stripe — Confirmación en cliente
  const stripeInit = await createStripePayment({
    amount: 4500,                 // number | requerido | centavos | —
    currency: "CAD",              // "CAD"|"USD" | opcional | "CAD"
    items: [{ id:"taco3", name:"3 Tacos", qty:1, unitAmount:4500 }], // LineItem[] | opcional | —
    metadata: { orderRef: "HTW-00123" }, // objeto | opcional | pares string | —
    captureMethod: "automatic"    // "automatic"|"manual" | opcional | "automatic"
  });
  // stripeInit.clientSecret  → úsalo con stripe.confirmCardPayment(...)

  // PayPal — Flujo con aprobación
  const pp = await createPayPalOrder({
    amount: 2800,                 // number | requerido | —
    currency: "CAD",              // opcional | "CAD"|"USD" | "CAD"
    returnUrl: "/checkout/success", // string | opcional | URL relativa/abs | —
    cancelUrl: "/checkout/cancel"   // string | opcional | —
  });
  // Redirige a pp.approveUrl y al regresar, captura:
  // const ok = await capturePayPalOrder(pp.id);

NOTAS CLAVE:
  — Seguridad: el monto REAL debe calcularse/verificarse en servidor. No confiar en amount del cliente.
  — Idempotencia: usa claves idempotentes (cabecera o metadata.orderRef) al crear/capturar para evitar cargos duplicados.
  — Webhooks: la conciliación final debe ocurrir vía /api/ * /webhook (verifica firma, actualiza pedido/stock/receipt).
  — Moneda: fija "CAD" por defecto; evita mezclar monedas por sesión. Normaliza a centavos (int).
  — Privacidad: no enviar PII en metadata. Solo referencias internas (orderRef, sessionId).
  — Errores: capturar status HTTP != 200; mapear mensajes amigables para UI y loggear detalles en servidor.
  — Stripe manual: útil para “bar tab” (autorización previa y captura posterior). Requiere captura dentro del período permitido.
  — PayPal approve flow: returnUrl/cancelUrl deben ser HTTPS y estar permitidas en la app de PayPal.
  — Tracking: añade orderRef/UTM en metadata para trazabilidad (no en amount). Registrar provider ("stripe"|"paypal").

DEPENDENCIAS:
  Fetch API (nativa) · Rutas internas Next:
    /api/stripe/create-order · /api/stripe/capture-order · /api/stripe/webhook
    /api/paypal/create-order · /api/paypal/capture-order · /api/paypal/webhook
  Variables de entorno (lado servidor en las rutas API):
    STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_WEBHOOK_ID
────────────────────────────────────────────────────────── */
