import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const API_VERSION: Stripe.LatestApiVersion | undefined = undefined;

let stripe: Stripe | null = null; // singleton perezoso
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('Missing STRIPE_SECRET_KEY');
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, API_VERSION ? { apiVersion: API_VERSION } : undefined);
  }
  return stripe;
}

export async function POST(req: NextRequest) {
  // Evita romper si falta config
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 200 });
  }

  const { line_items, success_url, cancel_url, mode = 'payment' } = await req.json();

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode,                  // 'payment' | 'subscription'
      line_items,            // [{ price: 'price_xxx', quantity: 1 }] o price_data
      success_url,           // URL absoluta, p.ej. `${origin}/pagado?sid={CHECKOUT_SESSION_ID}`
      cancel_url,
      // customer_email, client_reference_id, metadata... (si los usas)
    });
    return NextResponse.json({ id: session.id, url: session.url }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

/* ---------------------------------------------------------------------------
USO Y NOTAS — /api/stripe/create-order

OBJETIVO
Crear una Stripe Checkout Session desde el servidor y devolver la URL para redirigir.

PARÁMETROS (JSON body)
- line_items: Array de ítems. Ej.: [{ price: 'price_123', quantity: 1 }]
- success_url: URL absoluta donde Stripe redirige al pagar (puede incluir {CHECKOUT_SESSION_ID})
- cancel_url : URL absoluta de cancelación
- mode       : 'payment' (default) o 'subscription'

RESPUESTA
{ id: string, url: string } → redirige a `url`.

OBSERVACIONES
- Requiere env: STRIPE_SECRET_KEY (sk_…)
- Si usas Pricing Table no necesitas esta ruta.
- Agrega metadata/client_reference_id si quieres reconciliar con tu DB.
--------------------------------------------------------------------------- */

/* ─────────────────────────────────────────────────────────
DOC: API POST /api/stripe/create-order  (app/api/stripe/create-order/route.ts)
QUÉ HACE:
  Crea un PaymentIntent en Stripe desde el servidor y devuelve el client_secret
  para completar el pago en el cliente (o confirmar desde servidor si así se indica).
  Soporta captura automática o manual (para luego usar /api/stripe/capture-order),
  idempotencia, Stripe Connect y metadatos de negocio.

MÉTODO Y RUTA:
  POST /api/stripe/create-order

REQUEST (JSON esperado):
  type CreateStripeOrderBody = {
    amount: number                                   // requerido  entero en la menor unidad (cents) p.ej. 1200 = $12.00
    currency?: 'cad'|'usd'|'eur'                     // opcional  default 'cad'
    captureMethod?: 'automatic'|'manual'             // opcional  default 'automatic' ('manual' → requiere captura posterior)
    automaticPaymentMethods?: boolean                // opcional  default true  usa automatic_payment_methods.enabled
    confirm?: boolean                                // opcional  default false  si true, intenta confirmar en servidor
    paymentMethodId?: string                         // opcional  requerido si confirm=true y confirmas con un PM server-side
    returnUrl?: string                               // opcional  URL de retorno para flujos con redirección (3DS)
    customerId?: string                              // opcional  id de cliente en Stripe
    receiptEmail?: string                            // opcional  correo para recibo
    description?: string                             // opcional  descripción visible en el dashboard
    metadata?: Record<string,string>                 // opcional  claves propias (p.ej., bookingId)
    setupFutureUsage?: 'on_session'|'off_session'    // opcional  guardar método de pago para futuro
    paymentMethodTypes?: string[]                    // opcional  ej. ['card'] (normalmente omitido si automaticPaymentMethods=true)
    idempotencyKey?: string                          // opcional  recomendado para reintentos seguros
    connectAccountId?: string                        // opcional  si usas Stripe Connect (actúa sobre esa cuenta)
    expand?: string[]                                // opcional  ej. ['latest_charge.balance_transaction']
    debug?: boolean                                  // opcional  default false  incluye 'raw' en la respuesta
  }

EJEMPLO DE USO (fetch desde cliente/SSR):
  await fetch('/api/stripe/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: 1200,                               // requerido  1200 = $12.00
      currency: 'cad',                            // opcional  default 'cad'
      captureMethod: 'manual',                    // opcional  'automatic'|'manual'  default 'automatic'
      automaticPaymentMethods: true,              // opcional  default true
      confirm: false,                             // opcional  si true y sin PM, Stripe puede responder requires_action
      customerId: 'cus_123',                      // opcional
      metadata: { bookingId: 'bk_987' },          // opcional
      idempotencyKey: 'pi-create-bk_987-1200',    // opcional  recomendado
      debug: false                                // opcional
    })
  })

RESPUESTA 200 (shape sugerido):
  type CreateStripeOrderResponse = {
    ok: boolean
    status:
      | 'requires_payment_method'
      | 'requires_confirmation'
      | 'requires_action'
      | 'processing'
      | 'succeeded'
      | 'requires_capture'
      | 'error'
    paymentIntentId?: string
    clientSecret?: string                         // úsalo en el cliente con stripe.confirmPayment
    amount?: number                               // en cents
    currency?: string                             // ej. 'cad'
    captureMethod?: 'automatic'|'manual'
    nextActionType?: string                       // ej. 'use_stripe_sdk' | 'redirect_to_url' (si aplica)
    details?: string                              // mensaje corto
    raw?: unknown                                 // payload crudo si debug=true
  }

CÓDIGOS DE ESTADO COMUNES:
  200  Ok: creación exitosa (varios estados posibles según confirm)
  400  Bad Request: body inválido o falta amount
  409  Conflict: idempotencyKey en conflicto con otro payload
  500  Error del servidor/Stripe

FLUJO INTERNO (resumen de implementación en esta route):
  1) Inicializa Stripe con STRIPE_SECRET_KEY y apiVersion fija.
  2) Construye params para stripe.paymentIntents.create({
       amount, currency, capture_method,
       automatic_payment_methods: automaticPaymentMethods ? { enabled: true } : undefined,
       customer, receipt_email, description, metadata, setup_future_usage,
       payment_method_types (si se provee explícitamente),
       confirm (opcional), payment_method (si confirmas en servidor),
       return_url (si confirm y PM requiere redirección)
     }, { idempotencyKey, stripeAccount: connectAccountId, expand })
  3) Devuelve un shape estable con clientSecret, estado y banderas útiles.

ENTORNO / VARIABLES REQUERIDAS:
  STRIPE_SECRET_KEY            // requerido  clave secreta del servidor
  STRIPE_API_VERSION           // opcional  fija versión de API para consistencia
  STRIPE_CONNECT_DEFAULT       // opcional  id de cuenta conectada por defecto si procede

SEGURIDAD Y RUNTIME:
  - Nunca expongas STRIPE_SECRET_KEY en cliente; esta route corre solo en servidor.
  - Valida amount > 0 y entero; currency válida; y coherencia entre confirm/paymentMethodId.
  - Usa idempotencyKey estable (p.ej., hash de bookingId+amount) para reintentos.
  - El SDK de Stripe requiere runtime Node.js; evita Edge si usas el SDK oficial.

WEBHOOKS RECOMENDADOS (configúralos y maneja en /api/stripe/webhook):
  - payment_intent.succeeded
  - payment_intent.payment_failed
  - charge.captured (si usas capture_method='manual')
  - payment_intent.canceled

EJEMPLOS DE RESPUESTA:
  Creado (sin confirmar, flujo cliente):
    { ok: true, status: 'requires_payment_method', paymentIntentId: 'pi_...', clientSecret: 'pi_..._secret_...' }
  Requiere acción (3DS) tras confirmar en servidor:
    { ok: true, status: 'requires_action', paymentIntentId: 'pi_...', clientSecret: 'pi_..._secret_...', nextActionType: 'use_stripe_sdk' }
  Con captura manual lista:
    { ok: true, status: 'requires_capture', paymentIntentId: 'pi_...', clientSecret: 'pi_..._secret_...', captureMethod: 'manual' }

CHECKLIST RÁPIDO:
  - Validar body y tipos (amount en cents).
  - Definir capture_method según tu flujo (automatic vs manual).
  - Activar automatic_payment_methods a menos que necesites tipos fijos.
  - Usar idempotencyKey en la creación.
  - Registrar en DB: paymentIntentId, amount, currency, captureMethod y metadatos de negocio.
────────────────────────────────────────────────────────── */
