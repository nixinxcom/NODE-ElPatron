// app/lib/paypal.ts
import { toPayPalLocale, type PayPalRestLocale } from "@/app/lib/i18n/adapters";

export type CreateOrderOptions = {
  customId?: string | null;
  referenceId?: string | null;
  brandName?: string;
  locale?: PayPalRestLocale; // "es-ES" | "es-419" | "en-CA" | "fr-CA"
};

const BASE =
  process.env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

async function getAccessToken() {
  const client = process.env.PAYPAL_CLIENT_ID!;
  const secret = process.env.PAYPAL_CLIENT_SECRET!;
  const auth = Buffer.from(`${client}:${secret}`).toString("base64");

  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) throw new Error("PayPal auth failed");
  const data = await res.json();
  return data.access_token as string;
}

export async function createOrder(
  amount: string,
  currency = "CAD",
  opts: CreateOrderOptions = {}
) {
  const token = await getAccessToken();

  const purchaseUnit: any = {
    amount: { currency_code: currency, value: amount },
  };
  if (opts.customId) purchaseUnit.custom_id = opts.customId;
  if (opts.referenceId) purchaseUnit.reference_id = opts.referenceId;

  // Locale final: options.locale → adapters.toPayPalLocale() (derivado de env/headers)
  const locale: PayPalRestLocale = opts.locale ?? toPayPalLocale();

  const body: any = {
    intent: "CAPTURE",
    purchase_units: [purchaseUnit],
    // application_context sigue siendo usado por el Checkout clásico
    application_context: {
      shipping_preference: "NO_SHIPPING",
      user_action: "PAY_NOW",
      brand_name: opts.brandName ?? process.env.NEXT_PUBLIC_BRAND_NAME ?? undefined,
      locale, // <<—— aquí también
    },
    // payment_source.paypal.experience_context es el canal moderno
    payment_source: {
      paypal: {
        experience_context: {
          locale, // <<—— y aquí
        },
      },
    },
  };

  const res = await fetch(`${BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) throw new Error("PayPal create order failed");
  return res.json();
}

export async function captureOrder(orderID: string) {
  const token = await getAccessToken();
  const res = await fetch(`${BASE}/v2/checkout/orders/${orderID}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("PayPal capture failed");
  return res.json();
}

// (opcional) para leer el custom_id desde el webhook o conciliación manual:
export async function getOrder(orderID: string) {
  const token = await getAccessToken();
  const res = await fetch(`${BASE}/v2/checkout/orders/${orderID}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("PayPal get order failed");
  return res.json();
}

/* ─────────────────────────────────────────────────────────
DOC: Helpers PayPal (cliente + llamadas internas) — app\lib\paypal.ts
QUÉ HACE:
  Proporciona utilidades para integrar el flujo de PayPal en el cliente:
  1) Carga del SDK JS de PayPal de forma idempotente.
  2) Wrappers para crear y capturar órdenes vía rutas internas:
     /api/paypal/create-order y /api/paypal/capture-order.
  3) Tipos/contratos para estandarizar moneda (CAD por defecto), ítems y metadatos.

API / EXPORTS / RUTA:
  — Tipos:
    type PpCurrency = "CAD" | "USD";                                   // valores permitidos | default: "CAD"
    interface PpItem { id:string; name:string; qty:number; unitAmount:number } // centavos
    interface CreatePpOrderInput {
      amount: number;              // requerido | centavos (>0)
      currency?: PpCurrency;       // opcional  | "CAD"|"USD" | default: "CAD"
      items?: PpItem[];            // opcional  | desglose (no confiable en cliente)
      returnUrl?: string;          // opcional  | usado en approve flow
      cancelUrl?: string;          // opcional  | usado en approve flow
      metadata?: Record<string,string>; // opcional | claves simples (orderRef, utm, etc.)
      intent?: "CAPTURE"|"AUTHORIZE";  // opcional  | default: "CAPTURE"
      locale?: string;             // opcional  | ej. "es_CA"
    }
    interface CreatePpOrderResult { id:string; status:"CREATED"; approveUrl:string }
    interface CapturePpResult { id:string; status:string }

  — Funciones:
    loadPayPalSdk(opts?: { clientId?: string; currency?: PpCurrency; intent?: "CAPTURE"|"AUTHORIZE"; locale?: string; components?: string }): Promise<void>
      # Inyecta el script "https://www.paypal.com/sdk/js" una sola vez.
      # Usa window.paypal tras la carga. Evita duplicados con marca global.

    isPayPalReady(): boolean
      # true si window.paypal está disponible (SDK cargado).

    createPayPalOrder(input: CreatePpOrderInput): Promise<CreatePpOrderResult>
      # POST → /api/paypal/create-order con { amount, currency, items?, returnUrl?, cancelUrl?, metadata?, intent? }.

    capturePayPalOrder(orderId: string): Promise<CapturePpResult>
      # POST → /api/paypal/capture-order con { orderId }.

USO (ejemplo completo):
  // Tipo | opcional | valores permitidos | default (comentado)
  "use client";
  import { loadPayPalSdk, isPayPalReady, createPayPalOrder, capturePayPalOrder } from "@/app/lib/paypal";

  async function montarBotonPayPal(mountId: string) {
    // 1) Cargar SDK (solo una vez)
    await loadPayPalSdk({
      clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID as string, // string | opcional | "sb" o live | —
      currency: "CAD",     // "CAD"|"USD" | opcional | "CAD"
      intent: "CAPTURE",   // "CAPTURE"|"AUTHORIZE" | opcional | "CAPTURE"
      locale: "es_CA"      // string | opcional | BCP47 | —
    });

    if (!isPayPalReady()) return;

    // 2) Renderizar botones con el SDK
    // Nota: evitar datos sensibles en el cliente; el servidor recalcula montos reales.
    // @ts-ignore (tipado de window.paypal)
    window.paypal.Buttons({
      createOrder: async () => {
        const { id } = await createPayPalOrder({
          amount: 2800,           // number | requerido | centavos | —
          currency: "CAD",        // opcional | "CAD"|"USD" | "CAD"
          returnUrl: "/checkout/success", // string | opcional
          cancelUrl: "/checkout/cancel",  // string | opcional
          metadata: { orderRef: "HTW-00123" } // objeto | opcional
        });
        return id; // devuelve orderID al SDK
      },
      onApprove: async (data:any) => {
        // data.orderID contiene el id creado arriba
        const res = await capturePayPalOrder(data.orderID);
        // Maneja estado res.status === "COMPLETED"
      },
      onError: (err:any) => {
        // logging/UX de error
      }
    }).render(`#${mountId}`);
  }

NOTAS CLAVE:
  — SSR/CSR: solo cliente. Condicionar a typeof window !== "undefined".
  — Seguridad: nunca uses secretos en el cliente. El cálculo de amount debe validarse en servidor.
  — Webhooks: la conciliación final debe depender de /api/paypal/webhook (firma + actualización de estado).
  — Idempotencia: al capturar, maneja reintentos seguros (mismo orderId). Considera PayPal-Request-Id en el backend.
  — Rendimiento: carga el SDK únicamente en páginas de checkout. Evita múltiples inclusiones del script.
  — i18n: puedes pasar locale al SDK ("es_CA", "en_CA", "fr_CA"). La moneda por defecto del proyecto es "CAD".
  — Tracking: añade orderRef/utm en metadata (cliente) y regístralo en servidor para auditoría.
  — Accesibilidad/UX: reserva un contenedor con altura mínima para evitar CLS al montar los botones.

DEPENDENCIAS:
  Fetch API · Rutas internas Next: /api/paypal/create-order, /api/paypal/capture-order, /api/paypal/webhook
  SDK JS de PayPal (window.paypal) — opcionalmente @paypal/paypal-js si se prefiere loadScript helper
────────────────────────────────────────────────────────── */
