// app/lib/firebaseAdmin.ts  (server-only)
import 'server-only';
import { initializeApp, getApps, cert, applicationDefault, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, Timestamp, type Firestore } from 'firebase-admin/firestore';

// ---- ENV normalizadas (acepta ambas variantes de clave) ----
const PROJECT_ID   = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || undefined;
const CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL || undefined;

// Soporta FIREBASE_ADMIN_PRIVATE_KEY (tu nombre original) y FIREBASE_PRIVATE_KEY (otra convención)
const RAW_PRIVATE_KEY =
  process.env.FIREBASE_ADMIN_PRIVATE_KEY ??
  process.env.FIREBASE_PRIVATE_KEY ??
  undefined;

// Normaliza: soporta multilínea real o '\n' escapados
const PRIVATE_KEY =
  typeof RAW_PRIVATE_KEY === 'string'
    ? (RAW_PRIVATE_KEY.includes('\\n') ? RAW_PRIVATE_KEY.replace(/\\n/g, '\n') : RAW_PRIVATE_KEY)
    : undefined;

// Solo usamos cert() si tenemos **ambos**: email + private_key
const hasExplicitCreds = Boolean(CLIENT_EMAIL && PRIVATE_KEY);

let app: App;
if (getApps().length) {
  app = getApps()[0]!;
} else {
  app = initializeApp({
    credential: hasExplicitCreds
      ? cert({
          projectId: PROJECT_ID,
          clientEmail: CLIENT_EMAIL!,
          privateKey: PRIVATE_KEY!, // garantizado por hasExplicitCreds
        })
      : applicationDefault(),       // si no hay SA completa, cae a ADC (no falla en import)
    projectId: PROJECT_ID,
  });
}

const adminAuth: Auth = getAuth(app);
const adminDb: Firestore = getFirestore(app);

/* ===== Exports principales (sin cambios) ===== */
export function getAdminAuth() {
  return adminAuth;
}
export function getAdminDb() {
  return adminDb;
}
export { FieldValue, Timestamp };

/* ===== Aliases de compatibilidad (sin cambios) =====
   Para código existente que hace:
     import { db, FieldValue } from '@/app/lib/firebaseAdmin';
*/
export const auth = adminAuth;
export const db = adminDb;
