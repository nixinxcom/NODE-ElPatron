// app/lib/verifyFirebaseToken.ts  (server-only)

import { getAdminAuth } from './firebaseAdmin';
import type { DecodedIdToken } from './authz';

/**
 * Lee "Authorization: Bearer <ID_TOKEN>", verifica con Admin SDK
 * y retorna el decoded. Si el header no está o falla, retorna null.
 */
export async function verifyBearerIdToken(
  authHeader?: string | null
): Promise<DecodedIdToken | null> {
  if (!authHeader) return null;
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;

  const idToken = m[1].trim();
  if (!idToken) return null;

  try {
    const adminAuth = getAdminAuth();
    // `checkRevoked=false` para que sea rápido; si quieres usar true, habilítalo.
    const decoded = await adminAuth.verifyIdToken(idToken, false);
    return decoded as DecodedIdToken;
  } catch (e) {
    // Silencioso: si algo falla, devolvemos null y el caller decide (403)
    return null;
  }
}
