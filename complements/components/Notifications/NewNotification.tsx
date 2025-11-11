"use client";

import { useState } from "react";
import { useNotifications } from "@/app/lib/notifications/provider";
import { sendNotification } from "@/app/lib/notifications/client";
import type {
  NotificationTarget,
  CreateNotificationInput,
} from "@/app/lib/notifications/types";

type NewNotificationProps = {
  label?: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  clickAction?: string;
  target?: NotificationTarget;
};

export function NewNotification({
  label = "Enviar notificación",
  title,
  body,
  data,
  clickAction,
  target = { type: "broadcast" },
}: NewNotificationProps) {
  const { enabled } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Si el cliente no tiene notifications contratado, no mostramos nada.
  if (!enabled) return null;

  const handleClick = async () => {
    setLoading(true);
    setMsg(null);

    try {
      const input: CreateNotificationInput = {
        target,
        payload: { title, body, data, clickAction },
      };

      const res = await sendNotification(input);
      setMsg(
        `Enviada. OK: ${res.successCount}, errores: ${res.failureCount}`
      );
    } catch (err: any) {
      setMsg(err.message || "Error al enviar la notificación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inline-flex flex-col gap-1">
      <button
        onClick={handleClick}
        disabled={loading}
        className="px-4 py-2 rounded border border-white/40 hover:bg-white/10 disabled:opacity-50"
      >
        {loading ? "Enviando..." : label}
      </button>
      {msg && (
        <span className="text-xs text-zinc-300">
          {msg}
        </span>
      )}
    </div>
  );
}
