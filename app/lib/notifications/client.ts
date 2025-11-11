// app/lib/notifications/client.ts
"use client";

import type { CreateNotificationInput } from "./types";

export async function sendNotification(input: CreateNotificationInput) {
  const res = await fetch("/api/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // en prod aquí va Authorization: Bearer <token>
    },
    body: JSON.stringify(input),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || data.error) {
    throw new Error(data.error || "Error al enviar notificación");
  }

  return data as {
    ok: boolean;
    successCount: number;
    failureCount: number;
  };
}
