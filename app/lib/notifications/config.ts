// app/lib/notifications/config.ts
import type iSettings from "@/app/lib/settings/interface";
import { hasFaculty } from "@/app/lib/faculties";

export function hasNotificationsFaculty(settings?: iSettings | null): boolean {
  return hasFaculty(settings, "notifications");
}
