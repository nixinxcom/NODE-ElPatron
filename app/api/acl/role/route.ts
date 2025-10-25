// app/api/acl/role/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; // evita que Next intente prerender esta API en build

import { NextRequest, NextResponse } from 'next/server';
import { verifyBearerIdToken } from '@/app/lib/verifyFirebaseToken';
import { roleFromDecoded, type DecodedIdToken } from '@/app/lib/authz';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const decoded: DecodedIdToken | null = await verifyBearerIdToken(authHeader);

    const role = roleFromDecoded(decoded); // 'anon' | 'user' | 'admin' | 'superadmin'
    return NextResponse.json({ role }, { status: 200 });
  } catch (err) {
    console.error('ACL error:', err);
    // Nunca rompas el build/SSG: responde valor seguro
    return NextResponse.json({ role: 'anon' }, { status: 200 });
  }
}
