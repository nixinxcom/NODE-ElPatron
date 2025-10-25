import { useState, useEffect, useCallback } from "react";

type StorageType = "local" | "session";

interface Options<T> {
  storage?: StorageType;                              // 'local' (default) | 'session'
  serialize?: (v: T) => string;                      // por defecto JSON.stringify
  deserialize?: (raw: string) => T;                  // por defecto JSON.parse
}

export default function useLocalSessionStorage<T>(
  key: string,
  initialValue: T,
  opts: Options<T> = {}
) {
  const storageType = opts.storage ?? "local";
  const serialize = opts.serialize ?? ((v: T) => JSON.stringify(v));
  const deserialize = opts.deserialize ?? ((raw: string) => JSON.parse(raw) as T);

  const read = () => {
    if (typeof window === "undefined") return initialValue;
    try {
      const storage =
        storageType === "local" ? window.localStorage : window.sessionStorage;
      const item = storage.getItem(key);
      return item != null ? deserialize(item) : initialValue;
    } catch {
      return initialValue;
    }
  };

  // Estado
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Carga inicial + cuando cambian key/storage
  useEffect(() => {
    setStoredValue(read());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, storageType]);

  // Sincroniza cambios desde otras pestañas/ventanas
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (!e.storageArea) return;
      if (e.key !== key) return;
      setStoredValue(e.newValue != null ? deserialize(e.newValue) : initialValue);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key, deserialize, initialValue]);

  // Setter estable
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue(prev => {
        const v = typeof value === "function" ? (value as (p: T) => T)(prev) : value;
        if (typeof window !== "undefined") {
          try {
            const storage =
              storageType === "local" ? window.localStorage : window.sessionStorage;
            storage.setItem(key, serialize(v));
          } catch {}
        }
        return v;
      });
    },
    [key, storageType, serialize]
  );

  // Borrar clave
  const remove = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        const storage =
          storageType === "local" ? window.localStorage : window.sessionStorage;
        storage.removeItem(key);
      } catch {}
    }
    setStoredValue(initialValue);
  }, [key, storageType, initialValue]);

  return [storedValue, setValue, remove] as const;
}

/* ─────────────────────────────────────────────────────────
DOC: Hook local/session storage — functionalities/Hooks/LocalSessionStorageHook.tsx
QUÉ HACE:
  Sincroniza un estado React con localStorage o sessionStorage, con serialización JSON
  y eventos de storage (multitab).

API / EXPORTS / RUTA:
  — export function useStoredState<T>(key:string, initial:T, opts?:{
      storage?: "local"|"session"              // default: "local"
      version?: number                         // invalidar datos viejos
      migrate?: (old:any) => T                 // migrador opcional
    }): [T, (v:T|((prev:T)=>T))=>void, ()=>void]

USO (ejemplo completo):
  "use client";
  import { useStoredState } from "@/functionalities/Hooks/LocalSessionStorageHook";
  const [prefs, setPrefs, clearPrefs] = useStoredState("prefs", { locale:"es" });

NOTAS CLAVE:
  — SSR: proteger acceso a window; inicializar lazy.
  — Privacidad: no guardar PII/tokens.
  — Idempotencia: versionado para migraciones; limpiar cuando cambie de usuario.

DEPENDENCIAS:
  React · Web Storage API
────────────────────────────────────────────────────────── */
