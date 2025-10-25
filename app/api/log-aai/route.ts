// app/api/log-aai/route.ts
import 'server-only';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/app/lib/firebaseAdmin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  let raw = '';
  try {
    // sendBeacon suele mandar "text/plain"; aquí aceptamos cualquier content-type
    raw = await req.text();
    const events = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(events)) {
      return NextResponse.json({ ok: false, error: 'Invalid payload (expected array)' }, { status: 400 });
    }
    if (!events.length) {
      return NextResponse.json({ ok: true, saved: 0 });
    }

    const db = getAdminDb(); // Debe devolver admin.firestore()
    const col = db.collection('aai_logs');
    const batch = db.batch();

    // Tolerante: usa serverTimestamp si existe; si no, Timestamp.now()
    const serverTs: any =
      (FieldValue as any)?.serverTimestamp ? FieldValue.serverTimestamp() : Timestamp.now();

    for (const e of events) {
      batch.set(col.doc(), { ...e, serverTs });
    }

    await batch.commit();
    return NextResponse.json({ ok: true, saved: events.length });
  } catch (err: any) {
    // Log en server y expón detalle en dev para depurar rápido
    console.error('log-aai error:', err);
    const msg =
      process.env.NODE_ENV !== 'production'
        ? String(err?.message || err)
        : 'Server error';
    return NextResponse.json({ ok: false, error: msg, raw }, { status: 500 });
  }
}
