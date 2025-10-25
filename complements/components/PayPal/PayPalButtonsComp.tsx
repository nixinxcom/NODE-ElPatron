'use client';

import React from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import type { ReactPayPalScriptOptions, PayPalButtonsComponentProps } from '@paypal/react-paypal-js';

type Props = {
  amount: string;
  currency?: 'CAD' | 'USD' | 'EUR';
  createOrderUrl?: string;
  captureOrderUrl?: string;
  onApproved?: (details: any) => void;
  onError?: (err: any) => void;
  style?: PayPalButtonsComponentProps['style'];
};

export default function PayPalButtonsComp({
  amount,
  currency = 'CAD',
  createOrderUrl = '/api/paypal/create-order',
  captureOrderUrl = '/api/paypal/capture-order',
  onApproved,
  onError,
  style,
}: Props) {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!;

  // 👇 Usa clientId (camelCase) y 'capture' en minúsculas
  const options: ReactPayPalScriptOptions = {
    clientId,
    currency,
    intent: 'capture',
    components: 'buttons',
  };

  return (
    <PayPalScriptProvider options={options}>
      <PayPalButtons
        style={style ?? { layout: 'vertical', shape: 'rect' }}
        forceReRender={[amount, currency]}
        createOrder={async () => {
          const res = await fetch(createOrderUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, currency }),
          });
          const data = await res.json();
          return data.id as string; // orderID
        }}
        onApprove={async (data) => {
          const res = await fetch(captureOrderUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderID: (data as any).orderID }),
          });
          const capture = await res.json();
          onApproved?.(capture);
        }}
        onError={(err) => {
          console.error('PayPal error:', err);
          onError?.(err);
        }}
      />
    </PayPalScriptProvider>
  );
}

/* ─────────────────────────────────────────────────────────
DOC: PayPalButtonsComp — complements/components/PayPal/PayPalButtonsComp.tsx
QUÉ HACE:
  Renderiza los botones oficiales de PayPal (SDK) y orquesta create/capture mediante rutas internas.
  Expone callbacks de resultado/errores.

API / EXPORTS / RUTA:
  — export interface PayPalButtonsProps {
      amount: number; currency?: "CAD"|"USD"; returnUrl?: string; cancelUrl?: string;
      metadata?: Record<string,string>; intent?: "CAPTURE"|"AUTHORIZE"; locale?: string; className?: string;
      onResult?: (r:{ status:string; orderId?:string })=>void; onError?: (e:any)=>void
    }
  — export default function PayPalButtonsComp(p:PayPalButtonsProps): JSX.Element

USO (ejemplo completo):
  "use client";
  <PayPalButtonsComp amount={2800} returnUrl="/ok" cancelUrl="/cancel" metadata={{orderRef:"HTW-1"}} />

NOTAS CLAVE:
  — Validación de monto en servidor. Webhook para conciliación.
  — Cargar SDK una sola vez (helpers de app/lib/paypal).

DEPENDENCIAS:
  window.paypal SDK · "@/app/lib/paypal"
────────────────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────────────
DOC: USO — complements/components/PayPal/PayPalButtonsComp.tsx
  "use client";
  import PayPalButtonsComp from "@/complements/components/PayPal/PayPalButtonsComp";

  export default function Checkout() {
    return (
      <PayPalButtonsComp
        amount={2800}                         // number | requerido | centavos
        currency="CAD"                        // "CAD"|"USD" | opcional | default: "CAD"
        returnUrl="/checkout/success"         // string | opcional
        cancelUrl="/checkout/cancel"          // string | opcional
        metadata={{ orderRef:"HTW-00123" }}   // Record<string,string> | opcional
        intent="CAPTURE"                      // "CAPTURE"|"AUTHORIZE" | opcional | default: "CAPTURE"
        locale="es_CA"                        // string | opcional
        className="mt-4"
        onResult={(r)=>console.log(r)}        // (r)=>void | opcional
        onError={(e)=>console.error(e)}       // (e)=>void | opcional
      />
    );
  }
────────────────────────────────────────────────────────── */
