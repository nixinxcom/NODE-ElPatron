'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/complements/components/AuthenticationComp/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './Authentication.module.css';

export default function AuthenticationComp() {
  const {
    user, loading, isAnonymous,
    signInAnon, signInGoogle, signInFacebook,
    signInEmail, signUpEmail, logout
  } = useAuth();

  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/';

  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Si ya hay sesión, redirige a "next"
  useEffect(() => {
    if (!loading && user && !isAnonymous) {
      router.replace(next);
    }
  }, [loading, user, isAnonymous]);

  const run = async (fn: () => Promise<any>) => {
    setErr(null);
    setInfo(null);
    setBusy(true);
    try {
      await fn();
      // éxito -> redirige
      router.replace(next);
    } catch (e: any) {
      setErr(e?.message || 'Error al iniciar sesión.');
    } finally {
      setBusy(false);
    }
  };

  const onSignupEmail = async () => {
    setErr(null);
    setBusy(true);
    try {
      await signUpEmail(email, pass);
      setInfo('Cuenta creada. Revisa tu email para verificar la cuenta.');
      // Puedes decidir NO redirigir hasta que verifique el correo
      // router.replace(next);
    } catch (e: any) {
      setErr(e?.message || 'No se pudo crear la cuenta.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.AuthCard}>
      <h3 className={styles.Title}>Autenticación</h3>

      {(busy || loading) && <p className={styles.Muted}>Procesando…</p>}
      {err && <p className={styles.Error}>{err}</p>}
      {info && <p className={styles.Info}>{info}</p>}

      {!user && (
        <>
          <div className={styles.Row}>
            <button className={styles.Btn} disabled={busy} onClick={() => run(signInAnon)}>
              Entrar como invitado
            </button>
            <button className={styles.Btn} disabled={busy} onClick={() => run(signInGoogle)}>
              Entrar con Google
            </button>
            <button className={styles.Btn} disabled={busy} onClick={() => run(signInFacebook)}>
              Entrar con Facebook
            </button>
          </div>

          <div className={styles.EmailBox}>
            <input
              type="email"
              placeholder="correo@dominio.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={styles.Input}
              autoComplete="email"
            />
            <input
              type="password"
              placeholder="••••••••"
              value={pass}
              onChange={e => setPass(e.target.value)}
              className={styles.Input}
              autoComplete="current-password"
            />
            <div className={styles.Row}>
              <button
                className={styles.Btn}
                disabled={busy || !email || !pass}
                onClick={() => run(() => signInEmail(email, pass))}
              >
                Entrar
              </button>
              <button
                className={styles.BtnOutline}
                disabled={busy || !email || !pass}
                onClick={onSignupEmail}
              >
                Crear cuenta
              </button>
            </div>
          </div>
        </>
      )}

      {user && (
        <div className={styles.UserBox}>
          <p className={styles.Small}>
            Sesión: <strong>{user.email ?? user.uid}</strong>
          </p>
          <button className={styles.BtnDanger} onClick={logout}>
            Salir
          </button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
DOC: Authentication UI — complements/components/AuthenticationComp/AuthenticationComp.tsx
QUÉ HACE:
  Formulario de login/registro con email+password y botones de proveedores (Google, etc.).
  Consume AuthContext para ejecutar signIn/signOut y refleja estados de carga/errores.

API / EXPORTS / RUTA:
  — export interface AuthenticationProps {
      mode?: "signin"|"signup"                         // opcional | default: "signin"
      redirectTo?: string                              // opcional | URL tras éxito | default: "/"
      providers?: Array<"google"|"facebook"|"apple">   // opcional | default: ["google"]
      className?: string                               // opcional
    }
  — export default function AuthenticationComp(p:AuthenticationProps): JSX.Element

USO (ejemplo completo):
  "use client";
  import AuthenticationComp from "@/complements/components/AuthenticationComp/AuthenticationComp";
  <AuthenticationComp mode="signin" redirectTo="/cuenta" providers={["google"]} />

NOTAS CLAVE:
  — Validar email/password; deshabilitar submit mientras carga.
  — Accesibilidad: <label htmlFor>, aria-live en errores.
  — No loguear contraseñas ni mostrar detalles de errores sensibles.

DEPENDENCIAS:
  AuthContext · firebase/auth (vía contexto)
────────────────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────────────
DOC: USO (ejemplo completo) — complements/components/AuthenticationComp/AuthenticationComp.tsx
  "use client";
  import AuthenticationComp from "@/complements/components/AuthenticationComp/AuthenticationComp";

  export default function LoginPage() {
    return (
      <section className="max-w-md mx-auto">
        <h1>Acceso</h1>
        <AuthenticationComp
          mode="signin"                 // "signin"|"signup" | opcional | default: "signin"
          redirectTo="/cuenta"          // string | opcional | default: "/"
          providers={["google"]}        // Array<"google"|"facebook"|"apple"> | opcional | default: ["google"]
          className="mt-6"              // string | opcional
        />
      </section>
    );
  }
────────────────────────────────────────────────────────── */
