// lib/stripe.ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  // fija versión si quieres estabilidad de tipos
  // apiVersion: '2024-06-20',
});

/* ─────────────────────────────────────────────────────────
DOC: Helpers Stripe (cliente) — app/lib/stripe.ts
QUÉ HACE:
  Inicializa Stripe.js en cliente y expone un singleton (stripePromise) para evitar cargas duplicadas.
  Provee utilidades para configurar <Elements> (Payment Element) y confirmar pagos con el clientSecret
  que devuelve el backend (/api/stripe/create-order). Orientado a App Router (Next.js).

API / EXPORTS / RUTA:
  — export const STRIPE_PK: string
      Clave pública leída de process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (debe existir).
  — export const stripePromise: Promise<Stripe | null>
      Singleton de loadStripe(STRIPE_PK). Reutilizable en toda la app.
  — export async function getStripe(): Promise<Stripe | null>
      Resuelve la instancia de Stripe ya cargada (equivalente a stripePromise).
  — export function buildElementsOptions(input: {
        clientSecret: string;                 // requerido | client_secret del PaymentIntent/SetupIntent
        locale?: "es"|"en"|"fr";              // opcional  | default: "es"
        appearance?: Record<string, any>;     // opcional  | tema/variables de apariencia
      }): StripeElementsOptions
      Genera opciones tipadas para <Elements> (con mode y clientSecret).
  — export async function confirmPayment(params: {
        stripe?: Stripe;                      // opcional  | si no se pasa, usa getStripe()
        elements: StripeElements;             // requerido | instancia de Elements ya montada
        returnUrl?: string;                   // opcional  | URL de redirección tras 3DS | default: location.href
      }): Promise<{ status: string; paymentIntentId?: string; error?: string }>
      Llama a stripe.confirmPayment({ elements, confirmParams:{ return_url } }) y normaliza el resultado.

USO (ejemplo completo):
  // Tipo | opcional | valores permitidos | default
  "use client";
  import { Elements, useElements, useStripe, PaymentElement } from "@stripe/react-stripe-js";
  import { stripePromise, buildElementsOptions, confirmPayment } from "@/app/lib/stripe";
  import { createStripePayment } from "@/app/lib/payments"; // crea PaymentIntent en el backend

  function CheckoutForm() {
    const stripe = useStripe();
    const elements = useElements();

    async function onSubmit() {
      if (!elements) return;
      const res = await confirmPayment({
        stripe,                               // Stripe | opcional | instancia de hook | —
        elements,                             // StripeElements | requerido
        returnUrl: "/checkout/success"        // string | opcional | URL válida | location.href
      });
      // res.status: "succeeded" | "processing" | "requires_action" | ...
    }

    return (
      <form onSubmit={(e)=>{ e.preventDefault(); onSubmit(); }}>
        <PaymentElement />
        <button type="submit">Pagar</button>
      </form>
    );
  }

  export default async function Page() {
    // 1) Crear intención en el servidor
    const { clientSecret } = await createStripePayment({
      amount: 4500,              // number | requerido | centavos | —
      currency: "CAD"            // "CAD"|"USD" | opcional | "CAD"
    });

    // 2) Proveer Elements con opciones derivadas del clientSecret
    const options = buildElementsOptions({
      clientSecret,               // string | requerido
      locale: "es"                // "es"|"en"|"fr" | opcional | "es"
    });

    return (
      <Elements stripe={stripePromise} options={options}>
        <CheckoutForm />
      </Elements>
    );
  }

NOTAS CLAVE:
  — SSR/CSR: solo en cliente. No acceder a window en SSR. Cargar Stripe una vez por documento.
  — Seguridad: NUNCA calcular montos en el cliente; el backend crea/captura y valida precios/moneda.
  — Idempotencia: si repites confirmaciones, Stripe maneja el mismo PaymentIntent; controla estados en UI.
  — 3DS/Redirección: si requiere acción, confirmPayment usará return_url; asegúrate que sea HTTPS y ruta válida.
  — Moneda: por defecto “CAD” en el proyecto; mantén consistencia con /api/stripe/create-order.
  — Webhooks: la confirmación real y actualización de órdenes debe verificarse en /api/stripe/webhook.
  — Rendimiento/CLS: monta <PaymentElement> en un contenedor con altura mínima para evitar saltos de layout.
  — i18n: pasa locale a Elements para textos del widget (“es”, “en”, “fr”).

DEPENDENCIAS:
  @stripe/stripe-js · (opcional) @stripe/react-stripe-js
────────────────────────────────────────────────────────── */
