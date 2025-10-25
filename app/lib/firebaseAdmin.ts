// app/lib/firebaseAdmin.ts  (server-only)
import 'server-only';
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, Timestamp, type Firestore } from 'firebase-admin/firestore';

// --- ENV y normalización de la private key ---
const PROJECT_ID   = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || undefined;
const CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL || undefined;

function normalizeKey(raw?: string) {
  if (!raw) return undefined;
  let s = raw.trim();
  // Quita comillas si alguien la pegó en Vercel como "-----BEGIN..."
  if (s.startsWith('"') && s.endsWith('"')) s = s.slice(1, -1);
  // Normaliza saltos de línea
  s = s.replace(/\r\n/g, '\n');
  // Soporta una sola línea con \n escapados
  return s.includes('\\n') ? s.replace(/\\n/g, '\n') : s;
}

const PRIVATE_KEY = normalizeKey(
  process.env.FIREBASE_ADMIN_PRIVATE_KEY ?? process.env.FIREBASE_PRIVATE_KEY
);

// Flag público para que tu código pueda decidir si usa Admin o Web SDK
export const HAS_ADMIN_CREDS = Boolean(PROJECT_ID && CLIENT_EMAIL && PRIVATE_KEY);

// --- Inicialización LAZY de Admin: solo si hay SA completa ---
let app: App | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;

if (HAS_ADMIN_CREDS) {
  app = getApps()[0] ?? initializeApp({
    credential: cert({
      projectId: PROJECT_ID!,
      clientEmail: CLIENT_EMAIL!,
      privateKey: PRIVATE_KEY!, // ya normalizada
    }),
    projectId: PROJECT_ID!,
  });
  _auth = getAuth(app);
  _db   = getFirestore(app);
}

// Si alguien intenta usar Admin sin SA, fallamos en el MOMENTO de uso, no al importar el módulo
function assertAdmin() {
  if (!HAS_ADMIN_CREDS || !_auth || !_db) {
    throw new Error(
      'Firebase Admin credentials are missing. ' +
      'Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in Vercel.'
    );
  }
}

/* ===== Exports principales (compatibles) ===== */
export function getAdminAuth(): Auth {
  assertAdmin();
  return _auth!;
}
export function getAdminDb(): Firestore {
  assertAdmin();
  return _db!;
}
export { FieldValue, Timestamp };

/* ===== Aliases de compatibilidad =====
   Si algún código viejo hace:
     import { db, FieldValue } from '@/app/lib/firebaseAdmin';
   devolvemos proxies que lanzan error SOLO si se usan sin SA.
*/
const throwingProxy = new Proxy({}, { get() { assertAdmin(); } }) as any;
export const auth = (_auth ?? throwingProxy) as Auth;
export const db   = (_db   ?? throwingProxy) as Firestore;
