'use client';

import StripeLoaderComp from './StripeLoaderComp';

function Points() {
  return (
    <StripeLoaderComp
      pricingTableId="prctbl_1Q9cERQGiJq5YtHOxkVAZyca"
      publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
    />
  );
}

function PrepaidMemberships() {
  return (
    <StripeLoaderComp
      pricingTableId="prctbl_1Q9VVmQGiJq5YtHOw9ofDMKP"
      publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
    />
  );
}

function PromiseMemberships() {
  return (
    <StripeLoaderComp
      pricingTableId="prctbl_1Q9aDSQGiJq5YtHOc9pwbMfm"
      publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
    />
  );
}

export { Points, PrepaidMemberships, PromiseMemberships };

/* ─────────────────────────────────────────────────────────
DOC: Payment Models — complements/components/StripeLoaderComp/PaymentModels.tsx
QUÉ HACE:
  Define tipos/contratos de pagos para Stripe (y opcionalmente PayPal) usados por la UI:
  monedas, ítems de línea, estados y resultados.

API / EXPORTS / RUTA:
  — export type Currency = "CAD"|"USD"
  — export interface LineItem { id:string; name:string; qty:number; unitAmount:number } // centavos
  — export interface CreateStripeResult { clientSecret:string; paymentIntentId:string; amount:number; currency:Currency; status:string }
  — export interface CaptureStripeResult { paymentIntentId:string; status:string }
  — (opcional) PayPal: CreatePayPalResult/CapturePayPalResult
  — export interface CheckoutState { step:"init"|"confirming"|"succeeded"|"failed"; error?:string|null }

USO (ejemplo completo):
  import type { Currency, LineItem, CheckoutState } from "@/complements/components/StripeLoaderComp/PaymentModels";

NOTAS CLAVE:
  — Mantener sincronía con contratos del backend (/api/stripe/* y /api/paypal/*).
  — No incluir secretos en tipos.

DEPENDENCIAS:
  TypeScript types
────────────────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────────────
DOC: EJEMPLOS DE TIPOS — complements/components/StripeLoaderComp/PaymentModels.tsx
  // Importar tipos y usarlos en funciones/UI:
  import type {
    Currency, LineItem, CreateStripeResult, CaptureStripeResult, CheckoutState
  } from "@/complements/components/StripeLoaderComp/PaymentModels";

  const currency: Currency = "CAD";                  // "CAD"|"USD"
  const items: LineItem[] = [{ id:"taco3", name:"3 Tacos", qty:1, unitAmount:4500 }];

  const initialState: CheckoutState = { step:"init" }; // "init"|"confirming"|"succeeded"|"failed"

  function onCreated(r: CreateStripeResult) {
    console.log(r.clientSecret, r.amount, r.currency); // clientSecret:string, amount:number (centavos)
  }
  function onCaptured(r: CaptureStripeResult) {
    console.log(r.status); // string
  }
────────────────────────────────────────────────────────── */
