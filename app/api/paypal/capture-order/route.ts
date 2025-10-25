import { NextResponse } from 'next/server';
import { captureOrder } from '@/app/lib/paypal';
import { extractFirstCapture, savePayPalCapture } from '@/app/lib/payments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { orderID, userId = null } = await req.json();
    if (!orderID) return NextResponse.json({ error: 'orderID required' }, { status: 400 });

    // Captura en PayPal
    const order = await captureOrder(orderID);

    // Extrae el primer capture (o usa el objeto si ya es capture)
    const capture = extractFirstCapture(order);

    // Guarda idempotente por capture.id
    await savePayPalCapture(capture, { orderId: orderID, userId });

    // Devuelve detalles completos al cliente
    return NextResponse.json(order);
  } catch (e: any) {
    console.error('capture-order error:', e);
    return NextResponse.json({ error: e.message ?? 'capture failed' }, { status: 500 });
  }
}

/* ─────────────────────────────────────────────────────────
DOC: API POST /api/paypal/capture-order  (app/api/paypal/capture-order/route.ts)
QUÉ HACE:
  Captura un pedido de PayPal ya aprobado (Orders v2) llamando a /v2/checkout/orders/{orderId}/capture
  desde el servidor. Devuelve el estado de la captura, ids relevantes y, opcionalmente, el payload crudo
  de PayPal para auditoría o depuración.

MÉTODO Y RUTA:
  POST /api/paypal/capture-order

REQUEST (JSON esperado):
  type CaptureOrderBody = {
    orderId: string                     // requerido | PayPal Order ID (ej. "5O190127TN364715T")
    payerId?: string                    // opcional | Payer ID (a veces enviado en el return del approve)
    idempotencyKey?: string             // opcional | para PayPal-Request-Id y evitar capturas dobles
    debug?: boolean                     // opcional | default false | incluye 'raw' en la respuesta
  }

EJEMPLO DE USO (fetch desde cliente/SSR):
  await fetch('/api/paypal/capture-order', {
    method: 'POST',                                               // requerido | 'POST'
    headers: { 'Content-Type': 'application/json' },              // requerido
    body: JSON.stringify({
      orderId: '5O190127TN364715T',                               // requerido | string
      payerId: 'DUFRQ8GWYMJXC',                                   // opcional | string
      idempotencyKey: 'order-5O190127TN364715T-2025-08-29',       // opcional | string (recomendado)
      debug: false                                                // opcional | boolean | default false
    })
  })

RESPUESTA 200 (shape sugerido):
  type CaptureOrderResponse = {
    ok: boolean                                                   // true si la llamada fue exitosa
    status: 'captured' | 'already_captured' | 'not_approved' | 'error'  // estado de negocio
    orderId: string                                               // echo del orderId
    captureId?: string                                            // presente si se capturó
    amount?: { value: string; currency_code: string }             // monto capturado
    details?: string                                              // mensaje corto (p. ej., motivo de error)
    raw?: unknown                                                 // payload crudo de PayPal si debug=true
  }

CÓDIGOS DE ESTADO COMUNES:
  200  Ok: 'captured' o 'already_captured'
  400  Bad Request: falta orderId o body inválido
  409  Conflict: intento duplicado sin idempotencyKey
  422  Unprocessable: el pedido no está 'APPROVED' para captura
  500  Error del servidor o de PayPal

INTEGRACIÓN CON PAYPAL (resumen dentro de esta route):
  1) Obtener access token con Client ID y Secret (OAuth2):
     POST /v1/oauth2/token (grant_type=client_credentials) usando Basic Auth (client:secret)
  2) Capturar:
     POST /v2/checkout/orders/{orderId}/capture
     Headers recomendados:
       Authorization: Bearer <access_token>
       PayPal-Request-Id: <idempotencyKey>                       // opcional | evita capturas duplicadas
       Content-Type: application/json
  3) Mapear la respuesta al shape CaptureOrderResponse y manejar errores conocidos.

ENTORNO / VARIABLES REQUERIDAS:
  PAYPAL_CLIENT_ID            // requerido | tu Client ID (sandbox o live)
  PAYPAL_CLIENT_SECRET        // requerido | tu Secret
  PAYPAL_ENV=sandbox|live     // opcional | default 'sandbox'
  PAYPAL_API_BASE             // opcional | override; típicos:
                             //   sandbox: https://api-m.sandbox.paypal.com
                             //   live:    https://api-m.paypal.com

NOTAS DE SEGURIDAD Y RUNTIME:
  - Mantén Client ID/Secret solo en variables de servidor; no exponer en cliente.
  - Restringe la route a POST y valida el body (orderId string no vacío).
  - Idempotencia: genera idempotencyKey estable por orderId para reintentos seguros.
  - Considera rechazar peticiones cross-site o usa protección CSRF según tu flujo.
  - Esta integración suele requerir runtime Node.js (no Edge) por el SDK; si usas fetch nativo, Node y Edge funcionan.

WEBHOOKS RECOMENDADOS (configúralos en tu cuenta PayPal):
  - PAYMENT.CAPTURE.COMPLETED    // confirmar contabilidad y actualizar tu DB
  - PAYMENT.CAPTURE.DENIED       // manejar rechazos
  - CHECKOUT.ORDER.APPROVED      // opcional, si deseas rastrear aprobaciones antes de captura

EJEMPLO DE RESPUESTA EXITOSA (conceptual):
  {
    ok: true,
    status: 'captured',
    orderId: '5O190127TN364715T',
    captureId: '3C679366HH9089938',
    amount: { value: '12.00', currency_code: 'CAD' }
  }

EJEMPLO DE RESPUESTA YA CAPTURADA:
  {
    ok: true,
    status: 'already_captured',
    orderId: '5O190127TN364715T',
    details: 'Order already captured previously'
  }

DEPENDENCIAS (posibles):
  - SDK oficial: @paypal/checkout-server-sdk   // opcional | o fetch nativo
  - Next.js App Router: NextResponse, manejo de errores y JSON

CHECKLIST RÁPIDO:
  - Validar body (orderId) antes de llamar a PayPal.
  - Token OAuth2 en caché corto para reducir latencia (si aplica).
  - Usar PayPal-Request-Id con idempotencyKey.
  - Registrar en DB: orderId, captureId, monto, currency y timestamps.
────────────────────────────────────────────────────────── */
