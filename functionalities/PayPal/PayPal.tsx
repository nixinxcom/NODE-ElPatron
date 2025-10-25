

/* ─────────────────────────────────────────────────────────
DOC: PayPal Buttons — functionalities/PayPal/PayPal.tsx
QUÉ HACE:
  Componente cliente que carga el SDK de PayPal y renderiza los botones. Orquesta la creación
  y captura de órdenes usando rutas internas del proyecto.

API / EXPORTS / RUTA:
  — export interface PayPalProps {
      amount: number                          // centavos (int)
      currency?: "CAD"|"USD"                  // default: "CAD"
      returnUrl?: string                      // URL tras aprobación
      cancelUrl?: string                      // URL de cancelación
      metadata?: Record<string,string>        // orderRef/UTM/etc.
      intent?: "CAPTURE"|"AUTHORIZE"          // default: "CAPTURE"
      locale?: string                         // ej. "es_CA"
      mountId?: string                        // id del contenedor; default genera uno
      className?: string
    }
  — export default function PayPal(props: PayPalProps): JSX.Element

USO (ejemplo completo):
  "use client";
  import PayPal from "@/functionalities/PayPal/PayPal";
  <PayPal amount={2800} returnUrl="/checkout/success" cancelUrl="/checkout/cancel" metadata={{ orderRef:"HTW-00123" }} />

NOTAS CLAVE:
  — Seguridad: monto real validado en servidor; SDK solo crea/captura con ids del backend.
  — Webhooks: conciliación final en /api/paypal/webhook.
  — Rendimiento: cargar SDK solo donde se usa.

DEPENDENCIAS:
  "@/app/lib/paypal" (loadPayPalSdk, create/capture) · window.paypal
────────────────────────────────────────────────────────── */
