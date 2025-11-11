// app/[locale]/notificaciones/page.tsx  (o donde la tengas)
"use client";

import { useNotifications } from "@/app/lib/notifications/provider";

export default function NotificacionesDemo() {
  const ctx = useNotifications();

  return (
    <div className="p-6 text-zinc-100 space-y-4">
      <h1 className="text-xl font-semibold">Debug Notificaciones</h1>
      <pre className="text-xs bg-black/60 border border-white/10 rounded p-3">
        {JSON.stringify(ctx, null, 2)}
      </pre>

      {ctx.enabled ? (
        <>
          <p>Permiso del navegador: {ctx.permission}</p>
          <p>No leídas: {ctx.unread}</p>
          <button
            onClick={ctx.requestPermission}
            className="px-4 py-2 rounded border border-white/40 hover:bg-white/10"
          >
            Activar notificaciones
          </button>
        </>
      ) : (
        <p className="text-red-400">
          Notificaciones desactivadas según facultad efectiva.
        </p>
      )}
    </div>
  );
}
