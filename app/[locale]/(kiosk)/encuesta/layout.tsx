// app/[locale]/(kiosk)/encuesta/layout.tsx
import React from "react";
import KioskClient from "./KioskClient";
import s from "./Encuesta.module.css";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${s.kioskRoot} min-h-dvh w-dvw overflow-hidden select-none`}>
      <KioskClient />
      {children}
    </div>
  );
}