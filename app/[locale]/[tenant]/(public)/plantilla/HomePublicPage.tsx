// app/[locale]/(public)/plantilla/HelloBlock.tsx
"use client";

import FM from "@/complements/i18n/FM";
import styles from "./page.module.css";
import PayPalButtonsComp from "@/complements/components/PayPal/PayPalButtonsComp";

export default function HomePublicPage({
  ssrTime,
  locale,
}: { ssrTime: string; locale: string }) {
  return (
    <div className={styles.New}>
      <PayPalButtonsComp
        amount={"2800.00"}                    // number | requerido | centavos
        currency="CAD"                        // "CAD"|"USD" | opcional | default: "CAD"
        returnUrl="/checkout/success"         // string | opcional
        cancelUrl="/checkout/cancel"          // string | opcional
        metadata={{ orderRef:"HTW-00123" }}   // Record<string,string> | opcional
        intent="CAPTURE"                      // "CAPTURE"|"AUTHORIZE" | opcional | default: "CAPTURE"
        locale="es_MX"                        // string | opcional
        className="mt-4"
        onResult={(r)=>console.log(r)}        // (r)=>void | opcional
        onError={(e)=>console.error(e)}       // (e)=>void | opcional
      />
      <h1><FM id="NuevaPlantilla" defaultMessage="Esta Plantilla ya puede conectarse con Firebase" /></h1>
      <p className={styles.note}>
        <FM id="plantilla.locale" defaultMessage="Locale:" /> {locale} ·{" "}
        <FM id="plantilla.ssrTime" defaultMessage="SSR time:" /> {ssrTime}
      </p>
    </div>
  );
}
