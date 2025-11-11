// app/api/push/send/route.ts
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth } from '@/app/lib/firebaseAdmin';
import { getMessaging } from 'firebase-admin/messaging';
import baseSettings from '@/seeds/settings';
import type iSettings from '@/app/lib/settings/interface';
import { hasNotificationsFaculty } from '@/app/lib/notifications/config';
import { getTenantIdFromRequest } from '@/app/lib/notifications/tenant';
import { verifyBearerIdToken } from '@/app/lib/verifyFirebaseToken';
import { isSuperadminHard } from '@/app/lib/authz';

type Target =
  | { type: 'broadcast' }
  | { type: 'token'; token: string }
  | { type: 'user'; uid: string };

type Payload = {
  title: string;
  body: string;
  icon?: string;
  clickAction?: string;
  data?: Record<string, string>;
};

type Body = {
  target: Target;
  payload: Payload;
};

export async function POST(req: NextRequest) {
  try {
    // Seguridad: solo superadmin core
    const authHeader = req.headers.get('authorization');
    const decoded = await verifyBearerIdToken(authHeader);
    if (!decoded || !isSuperadminHard(decoded.email || decoded.uid)) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const { target, payload } = (await req.json()) as Body;

    if (!payload?.title || !payload?.body) {
      return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
    }

    const settings = (baseSettings as iSettings | undefined);
    if (!hasNotificationsFaculty(settings)) {
      return NextResponse.json({ error: 'notifications_disabled' }, { status: 403 });
    }

    const tenantId = getTenantIdFromRequest(req);
    const db = getAdminDb();
    const messaging = getMessaging();

    // Resuelve tokens según el target
    let tokens: string[] = [];

    if (target.type === 'token') {
      if (!target.token) return NextResponse.json({ error: 'missing_token' }, { status: 400 });
      tokens = [target.token];
    } else if (target.type === 'user') {
      const snap = await db
        .collection('tenants')
        .doc(tenantId)
        .collection('notificationTokens')
        .where('uid', '==', target.uid)
        .where('active', '==', true)
        .get();
      tokens = snap.docs.map(d => d.get('token')).filter(Boolean);
    } else if (target.type === 'broadcast') {
      const snap = await db
        .collection('tenants')
        .doc(tenantId)
        .collection('notificationTokens')
        .where('active', '==', true)
        .get();
      tokens = snap.docs.map(d => d.get('token')).filter(Boolean);
    }

    if (!tokens.length) {
      return NextResponse.json({ ok: true, sent: 0 });
    }

    const message = {
      tokens,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {},
      webpush: payload.clickAction
        ? {
            fcmOptions: { link: payload.clickAction },
          }
        : undefined,
    };

    const res = await messaging.sendEachForMulticast(message);

    await db
      .collection('tenants')
      .doc(tenantId)
      .collection('notifications')
      .add({
        ...payload,
        target,
        sentAt: new Date(),
        successCount: res.successCount,
        failureCount: res.failureCount,
      });

    return NextResponse.json({
      ok: true,
      successCount: res.successCount,
      failureCount: res.failureCount,
    });
  } catch (err) {
    console.error('[push/send] error', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
