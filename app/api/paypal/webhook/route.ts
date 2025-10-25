import { NextResponse } from 'next/server';
import { logPayPalWebhook, savePayPalCapture } from '@/app/lib/payments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BASE =
  process.env.PAYPAL_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

async function getAccessToken() {
  const client = process.env.PAYPAL_CLIENT_ID!;
  const secret = process.env.PAYPAL_CLIENT_SECRET!;
  if (!client || !secret) throw new Error('Missing PayPal server credentials');

  const auth = Buffer.from(`${client}:${secret}`).toString('base64');
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`PayPal auth failed: ${t}`);
  }
  const data = await res.json();
  return data.access_token as string;
}

export async function POST(req: Request) {
  // 1) Lee RAW body (requerido para verificación)
  const raw = await req.text();

  // PayPal a veces manda "ping"/pruebas; protege el parseo
  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 });
  }

  // 2) Cabeceras necesarias
  const transmissionId = req.headers.get('paypal-transmission-id');
  const transmissionTime = req.headers.get('paypal-transmission-time');
  const certUrl = req.headers.get('paypal-cert-url');
  const authAlgo = req.headers.get('paypal-auth-algo');
  const transmissionSig = req.headers.get('paypal-transmission-sig');
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;

  if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig || !webhookId) {
    return NextResponse.json({ error: 'missing headers or webhook id' }, { status: 400 });
  }

  try {
    // 3) Verifica firma con PayPal
    const token = await getAccessToken();
    const verifyRes = await fetch(`${BASE}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transmission_id: transmissionId,
        transmission_time: transmissionTime,
        cert_url: certUrl,
        auth_algo: authAlgo,
        transmission_sig: transmissionSig,
        webhook_id: webhookId,
        webhook_event: event,
      }),
    });

    if (!verifyRes.ok) {
      const t = await verifyRes.text();
      console.error('Webhook verify error:', t);
      return NextResponse.json({ error: 'verify failed' }, { status: 400 });
    }

    const verify = await verifyRes.json();
    if (verify.verification_status !== 'SUCCESS') {
      return NextResponse.json({ error: 'invalid signature' }, { status: 400 });
    }

    // 4) (Opcional pero recomendado) Loguea el webhook verificado
    await logPayPalWebhook(event);

    // 5) Procesa eventos relevantes
    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED': {
        const capture = event.resource; // es un objeto Capture
        await savePayPalCapture(capture, {
          orderId: capture?.supplementary_data?.related_ids?.order_id ?? null,
          userId: null,
        });
        break;
      }
      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.REFUNDED':
      case 'PAYMENT.CAPTURE.REVERSED': {
        const capture = event.resource;
        // savePayPalCapture actualiza/mergea el doc por capture.id (idempotente)
        await savePayPalCapture(capture, {
          orderId: capture?.supplementary_data?.related_ids?.order_id ?? null,
          userId: null,
        });
        break;
      }
      // Puedes escuchar más tipos según tu caso de uso:
      // case 'CHECKOUT.ORDER.APPROVED':
      // case 'CHECKOUT.ORDER.COMPLETED':
      default:
        // No-op para eventos no manejados
        break;
    }

    // 6) Responde 200 para detener reintentos
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('Webhook error:', e);
    // Devuelve 200 si ya verificaste la firma pero tu lógica interna falló
    // y NO quieres que PayPal reintente indefinidamente.
    // Si quieres reintentos, responde 500.
    return NextResponse.json({ error: e.message ?? 'webhook error' }, { status: 500 });
  }
}

/* ─────────────────────────────────────────────────────────
DOC: API POST /api/paypal/webhook  (app/api/paypal/webhook/route.ts)
QUÉ HACE:
  Recibe webhooks de PayPal (Orders v2) y verifica la firma con el endpoint oficial
  /v1/notifications/verify-webhook-signature. Si la verificación es válida, procesa
  el evento según event_type (p. ej., PAYMENT.CAPTURE.COMPLETED) y responde 200.

RUTA Y MÉTODO:
  POST /api/paypal/webhook

HEADERS QUE DEBES LEER (PayPal los envía):
  paypal-transmission-id        // requerido  identificador de la transmisión
  paypal-transmission-time      // requerido  ISO timestamp de envío
  paypal-transmission-sig       // requerido  firma de la transmisión
  paypal-cert-url               // requerido  URL del certificado
  paypal-auth-algo              // requerido  algoritmo de firma (p. ej., SHA256withRSA)
  content-type: application/json

BODY:
  JSON del evento tal como lo envía PayPal. Debes obtener el body crudo (string)
  para pasarlo a verify-webhook-signature sin alteraciones y, luego, parsearlo.

VERIFICACIÓN DE FIRMA (flujo recomendado dentro de esta route):
  1) Leer el body exacto como string:
     const raw = await request.text()          // importante: no usar request.json() aquí
  2) Construir payload para verificar:
     {
       auth_algo: header['paypal-auth-algo'],
       cert_url: header['paypal-cert-url'],
       transmission_id: header['paypal-transmission-id'],
       transmission_sig: header['paypal-transmission-sig'],
       transmission_time: header['paypal-transmission-time'],
       webhook_id: PAYPAL_WEBHOOK_ID,          // tu ID fijo de webhook (del dashboard)
       webhook_event: JSON.parse(raw)
     }
  3) Llamar a POST /v1/notifications/verify-webhook-signature con token OAuth:
     Authorization: Bearer <access_token>
     Content-Type: application/json
  4) Aceptar solo si verification_status === 'SUCCESS'. Si no, 400.

EVENTOS COMUNES (event_type) Y MANEJO SUGERIDO:
  CHECKOUT.ORDER.APPROVED
    — El comprador aprobó el pago. Puedes registrar el estado 'approved' y, si tu flujo lo requiere,
      disparar la captura en backend. Verifica idempotencia antes de realizar acciones.
  PAYMENT.CAPTURE.COMPLETED
    — Pago capturado con éxito. Marcar pedido/reserva como pagado, guardar captureId y monto.
  PAYMENT.CAPTURE.DENIED
    — Captura denegada. Registrar y notificar al usuario/operación manual si aplica.
  PAYMENT.CAPTURE.REFUNDED
    — Reembolso total o parcial. Actualizar contabilidad y estado del pedido.
  PAYMENT.CAPTURE.REVERSED
    — Reversión. Revisar contracargos y congelar servicios asociados.

RESPUESTA (shape sugerido):
  200 OK:
    { ok: true, received: true }                      // procesamiento aceptado
  400 Bad Request:
    { ok: false, error: 'signature_invalid' }         // verificación fallida o body inválido
  500 Error:
    { ok: false, error: 'internal_error' }            // fallo inesperado

IDEMPOTENCIA DE WEBHOOKS:
  - PayPal puede reenviar el mismo evento. Usa event.id como clave única para evitar
    reprocesar. Guarda un registro en DB (webhook_events) con eventId procesado=true.

ENTORNO / VARIABLES REQUERIDAS:
  PAYPAL_CLIENT_ID            // requerido   para OAuth2
  PAYPAL_CLIENT_SECRET        // requerido   para OAuth2
  PAYPAL_ENV=sandbox|live     // opcional    default 'sandbox'
  PAYPAL_API_BASE             // opcional    sandbox: https://api-m.sandbox.paypal.com  live: https://api-m.paypal.com
  PAYPAL_WEBHOOK_ID           // requerido   ID del webhook configurado en tu cuenta

NOTAS DE SEGURIDAD Y RUNTIME:
  - Nunca uses secrets del lado cliente. Todo en servidor.
  - Verifica SIEMPRE la firma antes de tocar tu DB.
  - Usa el body crudo exacto para verify-webhook-signature. Luego parsea a objeto.
  - Considera validar skew de tiempo (transmission_time) con tolerancia de minutos.
  - Responde rápido (ideal < 3 s). Si el trabajo cuesta, encola y procesa asíncrono.

PATRÓN DE IMPLEMENTACIÓN (pseudocódigo dentro de esta route):
  POST handler:
    try
      const headers = Object.fromEntries(request.headers)
      const raw = await request.text()
      const evt = JSON.parse(raw)
      const verified = await verifyWithPayPal(headers, raw)   // llama a /v1/notifications/verify-webhook-signature
      if (!verified) return NextResponse.json({ ok:false, error:'signature_invalid' }, { status:400 })

      // idempotencia
      if (await alreadyHandled(evt.id)) return NextResponse.json({ ok:true, received:true }, { status:200 })

      // switch por evt.event_type
      //   case 'PAYMENT.CAPTURE.COMPLETED': await handleCaptureCompleted(evt)
      //   case 'PAYMENT.CAPTURE.DENIED': await handleCaptureDenied(evt)
      //   etc.

      await markHandled(evt.id)
      return NextResponse.json({ ok:true, received:true }, { status:200 })
    catch (e)
      // registra error y responde 500 sin filtrar PII
      return NextResponse.json({ ok:false, error:'internal_error' }, { status:500 })

CÓDIGOS Y RETENTOS:
  - Responder 2xx indicará a PayPal que no reintente.
  - Un 4xx/5xx puede provocar reintentos automáticos. Úsalo solo cuando corresponda.

PRUEBAS:
  - Sandbox: configura el webhook en developer.paypal.com y usa el simulador de Webhooks.
  - Local: expón tu servidor con un túnel (ngrok) y apúntalo en la configuración del webhook.

REGISTRO Y PRIVACIDAD:
  - Loguea metadata mínima (event.id, event_type, resource.id, amount) y errores.
  - Evita guardar PII innecesaria del payload. Redacta emails/phones si decides persistir.

CHECKLIST RÁPIDO:
  - Leer body crudo con request.text().
  - Verificar firma con verify-webhook-signature y PAYPAL_WEBHOOK_ID correcto.
  - Idempotencia con event.id.
  - Mapear event_type a acciones de negocio y registrar resultados.
  - Responder 200 lo más pronto posible.
────────────────────────────────────────────────────────── */
