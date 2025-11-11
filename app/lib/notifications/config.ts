// app/lib/notifications/config.ts
import type iSettings from "@/app/lib/settings/interface";

export function hasNotificationsFaculty(settings?: iSettings | null): boolean {
  if (!settings?.faculties) return false;

  if (typeof settings.faculties.notifications === "boolean") {
    return settings.faculties.notifications;
  }

  // Si no está definido en settings efectivos, por ahora lo consideramos habilitado.
  return true;
}
