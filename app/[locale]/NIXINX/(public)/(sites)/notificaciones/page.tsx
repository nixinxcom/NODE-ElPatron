"use client";

import { useEffect, useState } from "react";
// import { canUseFaculty } from "@nixinx/core";
import { canUseFaculty } from "@/lib/sdk/facultiesClient";
import { NewNotification } from "@/complements/components/Notifications/NewNotification";

export default function NotificacionesPage() {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const ok = await canUseFaculty("notifications");
      if (!cancelled) setAllowed(ok);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Mientras pregunta al Core / API local
  if (allowed === null) {
    return (
      <main className="p-6 text-zinc-100">
        <h1 className="text-xl font-semibold">Demo de Notificaciones</h1>
        <p className="text-sm text-zinc-400">Verificando permisos...</p>
      </main>
    );
  }

  // Si el Core (o el seeds local) dice que NO tiene notifications
  if (!allowed) {
    return (
      <main className="p-6 text-zinc-100">
        <h1 className="text-xl font-semibold">Demo de Notificaciones</h1>
        <p className="text-sm text-red-400">
          Este tenant no tiene habilitado el módulo de notificaciones.
        </p>
      </main>
    );
  }

  // Permitido → mostramos el botón plug-and-play
  return (
    <main className="p-6 text-zinc-100 space-y-4">
      <h1 className="text-xl font-semibold">Demo de Notificaciones</h1>
      <p className="text-sm text-zinc-300">
        Presiona el botón para enviar una notificación de prueba a todos los
        dispositivos suscritos de este sitio.
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
