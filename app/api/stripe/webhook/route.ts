import { NextResponse } from 'next/server';
import { stripe } from '@/app/lib/stripe'; // si moviste lib/ a raíz: '@/lib/stripe'
import { saveStripePaymentByPI, saveStripePaymentFromSession } from '@/app/lib/payments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: 'missing signature' }, { status: 400 });

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: 'missing webhook secret' }, { status: 500 });

  // 1) Leer RAW body (obligatorio para verificar la firma)
  const raw = await req.text();

  let event: any;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err: any) {
    console.error('Stripe signature verify failed:', err?.message);
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId =
          session?.client_reference_id ??
          session?.metadata?.uid ??
          null;

        // Guarda por session y, si trae payment_intent, lo normaliza a PI
        await saveStripePaymentFromSession(session, {
          orderId: session?.id ?? null,
          userId,
        });
        break;
      }

      case 'payment_intent.succeeded':
      case 'payment_intent.processing':
      case 'payment_intent.payment_failed': {
        const pi = event.data.object;
        const userId = pi?.metadata?.uid ?? null;

        await saveStripePaymentByPI(pi, {
          orderId: pi?.metadata?.orderId ?? null,
          userId,
        });
        break;
      }

      case 'charge.succeeded':
      case 'charge.refunded':
      case 'charge.failed': {
        // Si prefieres consolidar por PaymentIntent:
        const charge = event.data.object;
        if (charge?.payment_intent) {
          const pi = await stripe.paymentIntents.retrieve(charge.payment_intent as string, {
            expand: ['charges'],
          });
          const userId = pi?.metadata?.uid ?? null;

          await saveStripePaymentByPI(pi, {
            orderId: pi?.metadata?.orderId ?? null,
            userId,
          });
        }
        break;
      }

      case 'invoice.paid':
      case 'invoice.payment_failed': {
        // Suscripciones: también normalizamos por PI
        const invoice = event.data.object;
        if (invoice?.payment_intent) {
          const pi = await stripe.paymentIntents.retrieve(invoice.payment_intent as string, {
            expand: ['charges'],
          });
          const userId = pi?.metadata?.uid ?? invoice?.customer_email ?? null;

          await saveStripePaymentByPI(pi, {
            orderId: invoice?.id ?? null,
            userId,
          });
        }
        break;
      }

      default:
        // otros eventos: no-op
        break;
    }

    return NextResponse.json({ received: true });
  } catch (e: any) {
    console.error('Stripe webhook handler error:', e);
    // Si quieres reintentos, deja 500. Si no, devuelve 200 y loguea.
    return NextResponse.json({ error: e.message ?? 'webhook error' }, { status: 500 });
  }
}

/* ─────────────────────────────────────────────────────────
DOC: API POST /api/stripe/webhook  (app/api/stripe/webhook/route.ts)
QUÉ HACE:
  Recibe webhooks de Stripe y verifica la firma con stripe.webhooks.constructEvent
  usando el body crudo y el header 'stripe-signature'. Si la verificación es válida,
  procesa event.type (p. ej., payment_intent.succeeded) y responde 200.

RUTA Y MÉTODO:
  POST /api/stripe/webhook

HEADERS QUE DEBES LEER:
  stripe-signature              // requerido  firma HMAC que Stripe envía para este endpoint
  content-type: application/json

RUNTIME (IMPORTANTE):
  - Usa runtime Node.js (no Edge), porque el SDK oficial de Stripe lo requiere.
  - Debes leer el BODY CRUDO (sin parsear) antes de verificar la firma.

LECTURA DEL BODY (App Router):
  // NO uses request.json() antes de verificar.
  // Usa el body crudo y pásalo a constructEvent.
  const payload = await request.text()                 // también puedes usar await request.arrayBuffer()
  const sig = request.headers.get('stripe-signature')  // firma enviada por Stripe
  const event = stripe.webhooks.constructEvent(payload, sig, STRIPE_WEBHOOK_SECRET)

FLUJO RECOMENDADO DENTRO DE ESTA ROUTE:
  1) Inicializa Stripe con STRIPE_SECRET_KEY y apiVersion fija (en servidor).
  2) Lee el body crudo con request.text() y toma el header 'stripe-signature'.
  3) Verifica con stripe.webhooks.constructEvent(payload, sig, STRIPE_WEBHOOK_SECRET).
     - Si lanza, responde 400 { ok:false, error:'signature_invalid' }.
  4) Idempotencia: usa event.id para evitar reprocesar el mismo webhook (Stripe reintenta).
  5) Switch por event.type y maneja la lógica de negocio:
     - 'payment_intent.succeeded'        → marcar pago como pagado; guardar ids/montos.
     - 'payment_intent.payment_failed'   → registrar fallo y notificar si aplica.
     - 'payment_intent.canceled'         → liberar reservas/recursos asociados.
     - 'charge.captured'                 → confirmar captura (si usas capture_method='manual').
     - 'checkout.session.completed'      → (si usas Checkout) cumplir pedido si payment_status='paid'.
     - Otros: registra de forma segura y descarta lo no usado.
  6) Marca event.id como procesado (DB) y responde 200 lo antes posible.

RESPUESTAS TÍPICAS:
  200 OK:
    { ok: true, received: true }                       // procesamiento aceptado
  400 Bad Request:
    { ok: false, error: 'signature_invalid' }          // verificación fallida o header faltante
  500 Error:
    { ok: false, error: 'internal_error' }             // fallo inesperado (sin filtrar PII)

IDEMPOTENCIA DE WEBHOOKS:
  - Stripe puede reenviar el mismo evento. Guarda event.id en tu DB (webhook_events).
  - Si ya fue procesado, responde 200 sin repetir efectos secundarios.

ENTORNO / VARIABLES REQUERIDAS:
  STRIPE_SECRET_KEY            // requerido  clave secreta del servidor
  STRIPE_WEBHOOK_SECRET        // requerido  secret del endpoint de webhook (desde el Dashboard o Stripe CLI)
  STRIPE_API_VERSION           // opcional  fija la versión del API para consistencia
  (Stripe Connect) STRIPE_WEBHOOK_SECRET_CONNECT   // opcional  si tienes un endpoint distinto para Connect

SEGURIDAD Y BUENAS PRÁCTICAS:
  - Nunca uses request.json() antes de verificar la firma; primero constructEvent con el body crudo.
  - No expongas STRIPE_SECRET_KEY al cliente.
  - Responde rápido (<3s). Si el trabajo es pesado, encola y procesa asíncrono (job/queue) tras verificar.
  - Valida coherencia de montos/monedas con tu DB antes de marcar como pagado.
  - No guardes PII innecesaria del payload (redacta emails/phones si decides persistir).

PRUEBAS:
  - Stripe CLI:
      stripe listen --forward-to localhost:3000/api/stripe/webhook
      stripe trigger payment_intent.succeeded
  - Dashboard → Developers → Webhooks → Añade endpoint y copia STRIPE_WEBHOOK_SECRET.

PATRÓN DE IMPLEMENTACIÓN (pseudocódigo dentro de esta route):
  export async function POST(request: NextRequest) {
    try {
      const payload = await request.text()
      const signature = request.headers.get('stripe-signature') ?? ''
      const event = stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET!)

      // Idempotencia
      if (await alreadyHandled(event.id)) {
        return NextResponse.json({ ok:true, received:true }, { status:200 })
      }

      switch (event.type) {
        case 'payment_intent.succeeded':
          // const pi = event.data.object as Stripe.PaymentIntent
          // await markPaid(pi.id, pi.amount_received, pi.currency, ...)
          break
        case 'payment_intent.payment_failed':
          // manejar fallo
          break
        case 'charge.captured':
          // confirmar captura
          break
        case 'checkout.session.completed':
          // const cs = event.data.object as Stripe.Checkout.Session
          // if (cs.payment_status === 'paid') fulfillOrder(...)
          break
        default:
          // registrar desconocidos de forma segura
          break
      }

      await markHandled(event.id)
      return NextResponse.json({ ok:true, received:true }, { status:200 })
    } catch (err: any) {
      // Si el error proviene de constructEvent → firma inválida
      const isSig = (err?.message || '').toLowerCase().includes('no signatures found') || (err?.type === 'StripeSignatureVerificationError')
      const status = isSig ? 400 : 500
      const error = isSig ? 'signature_invalid' : 'internal_error'
      return NextResponse.json({ ok:false, error }, { status })
    }
  }

CÓDIGOS Y RETENTOS:
  - Cualquier 2xx indica a Stripe que no reintente.
  - 4xx/5xx puede provocar reintentos (según políticas de Stripe).

CHECKLIST RÁPIDO:
  - runtime Node.js.
  - Leer body crudo: request.text().
  - Verificar con constructEvent usando STRIPE_WEBHOOK_SECRET correcto.
  - Idempotencia con event.id.
  - Mapear event.type a acciones de negocio y registrar resultados mínimos.
  - Responder 200 pronto; delegar trabajo pesado a colas si es necesario.
────────────────────────────────────────────────────────── */
