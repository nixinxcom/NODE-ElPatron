// complements/data/bssEffective.server.ts
import 'server-only';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import '@/app/lib/firebaseAdmin';         // asegura que el admin app esté inicializado una vez
const AdminDB = getFirestore();


export async function materializeBrandingEffective(locale: string, branding: any) {
  const coll = process.env.NEXT_PUBLIC_BRANDING_EFFECTIVE_COLL || 'branding_effective';
  await AdminDB.collection(coll).doc(locale).set(
    { data: branding, updatedAt: Timestamp.now() },
    { merge: true }
  );
}
