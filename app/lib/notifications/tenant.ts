// app/lib/notifications/tenant.ts
import type { NextRequest } from 'next/server';
import { resolveTenantFromHost, DEFAULT_TENANT } from '@/app/lib/tenant/resolve';

/**
 * Obtiene un identificador lógico de cliente según el host.
 * Hoy: monorepo multi-sitio.
 * Mañana (NX): se puede reemplazar por NIXINX_TENANT_ID fijo en env.
 */
export function getTenantIdFromRequest(req: NextRequest): string {
  const host = (req.headers.get('x-forwarded-host') || req.headers.get('host') || '').toLowerCase();
  const fromMap = resolveTenantFromHost(host);
  return fromMap || DEFAULT_TENANT || 'default';
}
