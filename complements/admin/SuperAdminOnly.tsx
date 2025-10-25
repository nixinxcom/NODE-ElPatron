'use client';
import React from 'react';

export default function SuperAdminOnly({ children }: { children: React.ReactNode }) {
  const [role, setRole] = React.useState<'anon'|'user'|'admin'|'superadmin'|null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const idToken = await (await import('firebase/auth')).getIdToken((await import('@/app/lib/services/firebase')).FbAuth.currentUser!, true).catch(()=>null);
        const res = await fetch('/api/acl/role', {
          headers: idToken ? { Authorization: `Bearer ${idToken}` } : undefined,
          cache: 'no-store',
        });
        const j = await res.json().catch(() => ({}));
        setRole(j?.role ?? 'anon');
      } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return null;
  if (role !== 'superadmin') {
    return <div className="p-6 text-sm opacity-80">
      <p>Acceso restringido: solo Superadmin.</p>
    </div>;
  }
  return <>{children}</>;
}
