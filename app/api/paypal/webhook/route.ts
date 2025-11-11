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