// app/api/push/subscribe/route.ts
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/app/lib/firebaseAdmin';
import baseSettings from '@/seeds/settings';
import type iSettings from '@/app/lib/settings/interface';
import { hasNotificationsFaculty } from '@/app/lib/notifications/config';
import { getTenantIdFromRequest } from '@/app/lib/notifications/tenant';

type Body = {
  token?: string;
  platform?: 'web' | 'ios' | 'android';
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    const token = (body.token || '').trim();
    const platform = body.platform || 'web';

    if (!token) {
      return NextResponse.json({ error: 'missing_token' }, { status: 400 });
    }

    // Carga settings “efectivos” actuales (hoy: seed local; mañana: FS/NIXINX.org)
    const settings = (baseSettings as iSettings | undefined);

    if (!hasNotificationsFaculty(settings)) {
      return NextResponse.json({ error: 'notifications_disabled' }, { status: 403 });
    }

    const tenantId = getTenantIdFromRequest(req);
    const db = getAdminDb();

    const now = new Date();
    const docRef = db
      .collection('tenants')
      .doc(tenantId)
      .collection('notificationTokens')
      .doc(token); // puedes cambiar a hash(token) si prefieres

    await docRef.set(
      {
        token,
        platform,
        active: true,
        updatedAt: now,
        createdAt: now,
      },
      { merge: true }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[push/subscribe] error', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
