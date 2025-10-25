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
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 200 });
  }

  const { payment_intent_id } = await req.json();
  if (!payment_intent_id) {
    return NextResponse.json({ error: 'payment_intent_id required' }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const pi = await stripe.paymentIntents.capture(payment_intent_id);
    return NextResponse.json({ status: pi.status }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

/* ---------------------------------------------------------------------------
USO Y NOTAS — /api/stripe/capture-order

OBJETIVO
Capturar manualmente un Payment Intent previamente autorizado.

PARÁMETROS (JSON body)
- payment_intent_id: string (ej. 'pi_...')

RESPUESTA
{ status: string }

OBSERVACIONES
- Solo necesario si usas capture manual; Checkout por defecto captura automático.
- Requiere STRIPE_SECRET_KEY.
--------------------------------------------------------------------------- */

/* ─────────────────────────────────────────────────────────
DOC: API POST /api/stripe/capture-order  (app/api/stripe/capture-order/route.ts)
QUÉ HACE:
  Captura un PaymentIntent de Stripe cuyo capture_method fue creado como 'manual'.
  Permite captura total o parcial, usando el SDK del servidor. Devuelve estado,
  ids relevantes y datos mínimos para actualizar tu base de datos.

MÉTODO Y RUTA:
  POST /api/stripe/capture-order

REQUEST (JSON esperado):
  type CaptureStripeBody = {
    paymentIntentId: string                 // requerido  ej. "pi_3Nx...Abc"
    amountToCapture?: number                // opcional  entero en la menor unidad (cents) ej. 1200
    idempotencyKey?: string                 // opcional  recomendado: evita capturas dobles
    connectAccountId?: string               // opcional  si usas Stripe Connect (actuará sobre esa cuenta)
    expand?: string[]                       // opcional  ej. ["charges.data.balance_transaction"]
    debug?: boolean                         // opcional  default false  incluye 'raw' en la respuesta
  }

EJEMPLO DE USO (fetch desde cliente/SSR):
  await fetch('/api/stripe/capture-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paymentIntentId: 'pi_3NxAbCdEfGhIj',
      amountToCapture: 1200,                      // opcional  1200 = $12.00
      idempotencyKey: 'pi_3NxAbCdEfGhIj-2025-08-29',
      connectAccountId: '',                       // opcional  si no hay, se ignora
      expand: ['charges.data.balance_transaction'],
      debug: false
    })
  })

RESPUESTA 200 (shape sugerido):
  type CaptureStripeResponse = {
    ok: boolean                                   // true si la captura fue exitosa
    status: 'captured' | 'already_captured' | 'requires_action' | 'not_capturable' | 'error'
    paymentIntentId: string
    amountCaptured?: number                        // en cents
    currency?: string                              // ej. "cad"
    chargeId?: string
    details?: string                               // mensaje corto o motivo
    raw?: unknown                                  // payload crudo de Stripe si debug=true
  }

CÓDIGOS DE ESTADO COMUNES:
  200  Ok                       'captured' o 'already_captured'
  400  Bad Request              falta paymentIntentId o body inválido
  409  Conflict                 intento duplicado sin idempotencyKey
  422  Unprocessable            el PaymentIntent no es capturable (estado o método)
  500  Error del servidor/Stripe

CONDICIONES PARA CAPTURAR:
  - El PaymentIntent debe existir y tener capture_method='manual'.
  - Debe estar en un estado capturable, típicamente 'requires_capture'.
  - amountToCapture debe ser menor o igual al amount_remaining y mayor a 0.
  - Para captura total, omite amountToCapture.

INTEGRACIÓN CON STRIPE (resumen dentro de esta route):
  1) Inicializar Stripe con STRIPE_SECRET_KEY y API version fija.
  2) Si connectAccountId viene en la petición, usar header 'Stripe-Account' para actuar en esa cuenta.
  3) Llamar a stripe.paymentIntents.capture(paymentIntentId, { amount_to_capture, expand }, { idempotencyKey, stripeAccount }).
  4) Mapear el resultado a CaptureStripeResponse, incluyendo amount_captured y currency del intent o del cargo.

ENTORNO / VARIABLES REQUERIDAS:
  STRIPE_SECRET_KEY           // requerido  clave secreta del servidor
  STRIPE_API_VERSION          // opcional  fija la versión del API para consistencia
  STRIPE_CONNECT_DEFAULT      // opcional  id de cuenta conectada por defecto si procede

SEGURIDAD Y RUNTIME:
  - No exponer STRIPE_SECRET_KEY al cliente; esta route corre solo en servidor.
  - El SDK oficial de Stripe requiere runtime Node.js; evita Edge para esta route si usas el SDK.
  - Valida el body y usa idempotencyKey estable basado en paymentIntentId para reintentos seguros.
  - Limita el origen o emplea CSRF si la route es invocable desde navegadores externos.

WEBHOOKS RECOMENDADOS:
  - payment_intent.succeeded         confirmar contabilidad y actualizar estado a pagado
  - charge.captured                  eventos de cargos capturados
  - payment_intent.canceled          si vence o se cancela antes de capturar

EJEMPLOS DE RESPUESTA:
  Captura exitosa:
    { ok: true, status: 'captured', paymentIntentId: 'pi_...', amountCaptured: 1200, currency: 'cad', chargeId: 'ch_...' }
  Ya capturado:
    { ok: true, status: 'already_captured', paymentIntentId: 'pi_...', details: 'PaymentIntent already captured' }
  No capturable:
    { ok: false, status: 'not_capturable', paymentIntentId: 'pi_...', details: 'Status requires_payment_method' }

CHECKLIST RÁPIDO:
  - Validar paymentIntentId y amountToCapture opcional.
  - Usar idempotencyKey en el request a Stripe.
  - Manejar estados no capturables y retornos parciales.
  - Registrar en DB: paymentIntentId, chargeId, amountCaptured, currency y timestamps.
────────────────────────────────────────────────────────── */
