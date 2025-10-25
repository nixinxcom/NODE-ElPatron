// app/api/acl/role/route.ts
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { verifyBearerIdToken } from '@/app/lib/verifyFirebaseToken';
import { roleFromDecoded, type DecodedIdToken } from '@/app/lib/authz';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const decoded: DecodedIdToken | null = await verifyBearerIdToken(authHeader);

    // Computa el rol dando prioridad a hardcode/claims con tu helper existente
    const role = roleFromDecoded(decoded); // 'anon' | 'user' | 'admin' | 'superadmin'

    // Nota: devolvemos 200 siempre para que el cliente no entre en bucles/404
    return NextResponse.json({ role }, { status: 200 });
  } catch {
    // En caso de fallo, rol seguro
    return NextResponse.json({ role: 'anon' }, { status: 200 });
  }
}
