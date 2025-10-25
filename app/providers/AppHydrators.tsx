// app/providers/AppHydrators.tsx
"use client";

import { useEffect } from "react";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { FbAuth } from "@/app/lib/services/firebase";
import { useAppContext } from "@/context/AppContext";

/**
 * Por defecto NO hacemos auto-login anónimo.
 * Actívalo con NEXT_PUBLIC_AUTO_GUEST=1 si lo necesitas.
 */
const AUTO_GUEST = process.env.NEXT_PUBLIC_AUTO_GUEST === "1";

export default function AppHydrators() {
  const { setAuthenticated, setUserState } = useAppContext();

  useEffect(() => {
    if (!FbAuth) return;

    const off = onAuthStateChanged(FbAuth, async (u) => {
      // Sin usuario actual
      if (!u) {
        if (AUTO_GUEST) {
          // Dispara login anónimo; onAuthStateChanged volverá a ejecutar con el user
          try {
            await signInAnonymously(FbAuth);
            return;
          } catch {
            // si falla, continuamos como no autenticado
          }
        }
        setAuthenticated(false);
        setUserState(null);            // ✅ ahora pasa User|null (no callback)
        return;
      }

      // Con usuario
      setAuthenticated(true);
      setUserState(u);                 // ✅ User de Firebase
    });

    return () => {
      try { off(); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
