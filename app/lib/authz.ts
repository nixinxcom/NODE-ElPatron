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
 * Ahora la autoridad dura (hard) se define por EMAIL hardcodeado.
 * Importa tus listas HARDCODE (Sets<string>) con correos en lowercase
 * desde superadmins.server.ts
 */
import { SUPERADMIN_EMAILS, HARDADMIN_EMAILS } from './superadmins.server';

/* ──────────────────────────────────────────────────────────────
   Utils
   ───────────────────────────────────────────────────────────── */
function normEmail(e?: string | null): string | undefined {
  const s = (e || '').trim().toLowerCase();
  return s.includes('@') ? s : undefined;
}

/* ──────────────────────────────────────────────────────────────
   Allowlist opcional por .env (SOLO para admin, NO superadmin)
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
  const e = normEmail(email);
  if (!e) return false;
  if (ADMIN_EMAILS.has(e)) return true;
  const at = e.lastIndexOf('@');
  if (at > 0) {
    const domain = e.slice(at + 1);
    if (ADMIN_DOMAINS.has(domain)) return true;
  }
  return false;
}

/* ──────────────────────────────────────────────────────────────
   Compat de APIs existentes (antes basadas en UID)
   ⚠️ Ahora esperan EMAIL. Si pasas UID, devolverán false.
   Mantener nombres evita romper imports en la PWA.
   ───────────────────────────────────────────────────────────── */
export function hasHardPower(uidOrEmail?: string | null): boolean {
  const e = normEmail(uidOrEmail);
  return !!e && (SUPERADMIN_EMAILS.has(e) || HARDADMIN_EMAILS.has(e));
}

export function isSuperadminHard(uidOrEmail?: string | null): boolean {
  const e = normEmail(uidOrEmail);
  return !!e && SUPERADMIN_EMAILS.has(e);
}

/* ──────────────────────────────────────────────────────────────
   Rol efectivo (PRIORIDAD: hardcode email > claims > user > anon)
   ───────────────────────────────────────────────────────────── */
export function roleFromDecoded(decoded: DecodedIdToken | null): Role {
  const e = normEmail(decoded?.email);
  if (!decoded) return 'anon';

  // 1) Hardcode por email
  if (e && SUPERADMIN_EMAILS.has(e)) return 'superadmin';
  if (e && HARDADMIN_EMAILS.has(e)) return 'admin';

  // 2) Claims
  if (decoded.superadmin === true) return 'superadmin';
  if (decoded.admin === true) return 'admin';

  // 3) Usuario autenticado sin privilegios (o sin email)
  return decoded.uid ? 'user' : 'anon';
}

/* ──────────────────────────────────────────────────────────────
   Checks de autorización (HARD = solo emails hardcodeados)
   ───────────────────────────────────────────────────────────── */
export function isAllowedSuperadminHard(decoded: DecodedIdToken | null): boolean {
  const e = normEmail(decoded?.email);
  return !!e && SUPERADMIN_EMAILS.has(e);
}

export function isAllowedAdminHard(decoded: DecodedIdToken | null): boolean {
  const e = normEmail(decoded?.email);
  return !!e && (SUPERADMIN_EMAILS.has(e) || HARDADMIN_EMAILS.has(e));
}

/**
 * Admin “amplio”: hard (email) o claims o allowlist por env.
 * - SUPERADMIN siempre solo del hardcode.
 * - ADMIN puede venir de hard, claims o allowlist .env (si quieres).
 */
export function isAllowedAdmin(decoded: DecodedIdToken | null): boolean {
  const e = normEmail(decoded?.email);
  if (e && (SUPERADMIN_EMAILS.has(e) || HARDADMIN_EMAILS.has(e))) return true;
  if (emailInAllowlist(decoded?.email)) return true;
  return decoded?.admin === true || decoded?.superadmin === true;
}

/* ──────────────────────────────────────────────────────────────
   Guards 403
   ───────────────────────────────────────────────────────────── */
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
   Variante “Plus” (compat con tu versión anterior)
   ───────────────────────────────────────────────────────────── */
export function isAllowedAdminHardPlus(decoded: DecodedIdToken | null): boolean {
  if (isAllowedAdminHard(decoded)) return true;
  return emailInAllowlist(decoded?.email);
}

export function roleFromDecodedPlus(decoded: DecodedIdToken | null): Role {
  const e = normEmail(decoded?.email);
  if (!decoded) return 'anon';

  // 1) Hard email
  if (e && SUPERADMIN_EMAILS.has(e)) return 'superadmin';
  if (e && HARDADMIN_EMAILS.has(e)) return 'admin';

  // 2) Allowlist por email / dominio
  if (emailInAllowlist(decoded?.email)) return 'admin';

  // 3) Claims
  if (decoded.superadmin === true) return 'superadmin';
  if (decoded.admin === true) return 'admin';

  return decoded.uid ? 'user' : 'anon';
}

/** Razón textual para debug/logs */
export function adminGrantReason(decoded: DecodedIdToken | null): string {
  const e = normEmail(decoded?.email);
  if (!decoded) return 'no-token';
  if (e && SUPERADMIN_EMAILS.has(e)) return 'email-superadmin';
  if (e && HARDADMIN_EMAILS.has(e)) return 'email-admin';
  if (emailInAllowlist(decoded?.email)) return 'email-allowlist';
  if (decoded.superadmin === true) return 'claim-superadmin';
  if (decoded.admin === true) return 'claim-admin';
  if (decoded.uid) return 'user';
  return 'anon';
}
