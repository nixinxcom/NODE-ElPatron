"use client";

import { NewNotification } from "@/complements/components/Notifications/NewNotification";

export default function NotificacionesPage() {
  return (
    <main className="p-6 text-zinc-100 space-y-4">
      <h1 className="text-xl font-semibold">Demo de Notificaciones</h1>
      <p className="text-sm text-zinc-300">
        Presiona el botón para enviar una notificación de prueba a todos los dispositivos suscritos de este sitio.
      </p>

      <NewNotification
        label="Enviar notificación de prueba"
        title="Test NIXINX"
        body="Esto es una prueba de notificaciones desde NIXINX Core."
        target={{ type: "broadcast" }}
        clickAction="/es/notificaciones"
        data={{ source: "demo-notificaciones" }}
      />
    </main>
  );
}
