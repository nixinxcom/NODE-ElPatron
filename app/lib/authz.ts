// app/lib/authz.ts


/** Tipos simples para no acoplar a firebase-admin aquí */
export type DecodedIdToken = {
  uid?: string;
  email?: string;
  admin?: boolean;
  superadmin?: boolean;
  email_verified?: boolean;
  [k: string]: any;
};

export type Role = 'anon' | 'user' | 'admin' | 'superadmin';

/**
 * Importa tus listas HARDCODE (Sets<string>) desde el archivo del repo.
 * Si usas alias "@", cambia la línea por:
 *   import { SUPERADMINS, HARD_ADMINS } from '@/app/lib/superadmins.server';
 */
import { SUPERADMINS, HARD_ADMINS } from './superadmins.server';

/** UID en listas hardcode (incluye superadmin) */
export function hasHardPower(uid?: string | null): boolean {
  if (!uid) return false;
  return SUPERADMINS.has(uid) || HARD_ADMINS.has(uid);
}

/** UID es superadmin hardcode */
export function isSuperadminHard(uid?: string | null): boolean {
  if (!uid) return false;
  return SUPERADMINS.has(uid);
}

/** Determina el rol efectivo. PRIORIDAD: hardcode > claims > user > anon */
export function roleFromDecoded(decoded: DecodedIdToken | null): Role {
  if (!decoded?.uid) return 'anon';
  const uid = decoded.uid;

  // 1) Hardcode primero
  if (SUPERADMINS.has(uid)) return 'superadmin';
  if (HARD_ADMINS.has(uid)) return 'admin';

  // 2) Claims (si existen)
  if (decoded.superadmin === true) return 'superadmin';
  if (decoded.admin === true) return 'admin';

  // 3) Usuario autenticado sin privilegios
  return 'user';
}

/** Solo superadmin hardcode (server/API crítica) */
export function isAllowedSuperadminHard(decoded: DecodedIdToken | null): boolean {
  return !!decoded?.uid && SUPERADMINS.has(decoded.uid);
}

/** Admin permitido por hardcode (incluye superadmin hardcode) */
export function isAllowedAdminHard(decoded: DecodedIdToken | null): boolean {
  return !!decoded?.uid && (SUPERADMINS.has(decoded.uid) || HARD_ADMINS.has(decoded.uid));
}

/** Admin “amplio” (hardcode o claims). Útil para zonas admin generales. */
export function isAllowedAdmin(decoded: DecodedIdToken | null): boolean {
  if (!decoded?.uid) return false;
  if (SUPERADMINS.has(decoded.uid) || HARD_ADMINS.has(decoded.uid)) return true;
  return decoded.admin === true || decoded.superadmin === true;
}

/** Helpers para lanzar 403 en server si no cumple hardcode */
export function requireHardAdminOrThrow(decoded: DecodedIdToken | null, msg = 'Forbidden'): void {
  if (!isAllowedAdminHard(decoded)) {
    const err: any = new Error(msg);
    err.status = 403;
    throw err;
  }
}

export function requireHardSuperadminOrThrow(decoded: DecodedIdToken | null, msg = 'Forbidden'): void {
  if (!isAllowedSuperadminHard(decoded)) {
    const err: any = new Error(msg);
    err.status = 403;
    throw err;
  }
}

/* ──────────────────────────────────────────────────────────────
   EXTENSIONES ADITIVAS: allowlist por email / dominio
   Configuración por ENV (opcional):
     ADMIN_EMAILS=admin@nixinx.com,otro@dominio.com
     ADMIN_EMAIL_DOMAINS=nixinx.com,miempresa.com
   ───────────────────────────────────────────────────────────── */

const _emailsFromEnv = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter(Boolean);

const _domainsFromEnv = (process.env.ADMIN_EMAIL_DOMAINS || '')
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter(Boolean);

/** Listas blancas opcionales (por email exacto y por dominio) */
export const ADMIN_EMAILS = new Set<string>(_emailsFromEnv);
export const ADMIN_DOMAINS = new Set<string>(_domainsFromEnv);

/** ¿El email está en allowlist (correo exacto o dominio)? */
export function emailInAllowlist(email?: string | null): boolean {
  if (!email) return false;
  const lower = String(email).toLowerCase();
  if (ADMIN_EMAILS.has(lower)) return true;
  const at = lower.lastIndexOf('@');
  if (at > 0) {
    const domain = lower.slice(at + 1);
    if (ADMIN_DOMAINS.has(domain)) return true;
  }
  return false;
}

/**
 * Variante "plus" que **no rompe** la actual:
 * Admin por hard UID (SUPERADMINS/HARD_ADMINS) **o** por email/domain allowlist.
 * Úsala en tus rutas si quieres aceptar email/domains además del hardcode UID.
 */
export function isAllowedAdminHardPlus(decoded: DecodedIdToken | null): boolean {
  if (!decoded?.uid) return false;
  if (SUPERADMINS.has(decoded.uid) || HARD_ADMINS.has(decoded.uid)) return true;
  return emailInAllowlist(decoded.email);
}

/** Role con allowlist por email (no sustituye tu roleFromDecoded actual) */
export function roleFromDecodedPlus(decoded: DecodedIdToken | null): Role {
  if (!decoded?.uid) return 'anon';

  // 1) Hardcode UID
  if (SUPERADMINS.has(decoded.uid)) return 'superadmin';
  if (HARD_ADMINS.has(decoded.uid)) return 'admin';

  // 2) Allowlist por email / dominio
  if (emailInAllowlist(decoded.email)) return 'admin';

  // 3) Claims
  if (decoded.superadmin === true) return 'superadmin';
  if (decoded.admin === true) return 'admin';

  return 'user';
}

/** Razón textual para debug/logs de por qué alguien es admin/superadmin */
export function adminGrantReason(decoded: DecodedIdToken | null): string {
  if (!decoded?.uid) return 'no-uid';
  if (SUPERADMINS.has(decoded.uid)) return 'uid-superadmin';
  if (HARD_ADMINS.has(decoded.uid)) return 'uid-admin';
  if (emailInAllowlist(decoded.email)) return 'email-allowlist';
  if (decoded.superadmin === true) return 'claim-superadmin';
  if (decoded.admin === true) return 'claim-admin';
  return 'none';
}
