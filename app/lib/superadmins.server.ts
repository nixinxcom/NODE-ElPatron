// app/lib/superadmins.server.ts
// ⚠️ Server-only
export const SUPERADMINS = new Set<string>([
  'EJuUvhZioyV19qYbc9bckVc4U7F3', // TU UID: hard superadmin
  'BEbk53t2YPUgswnYAnMXiI0WzDG3', // TU UID: hard superadmin
]);

export const HARD_ADMINS = new Set<string>([
  'YIr09pKZitN46envZAvyFIUZVWB3', // Admin fijo (opcional)
]);

export function hasHardPower(uid?: string | null): boolean {
  if (!uid) return false;
  return SUPERADMINS.has(uid) || HARD_ADMINS.has(uid);
}
