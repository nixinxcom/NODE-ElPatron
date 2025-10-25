// Framework
import React, { useState, useEffect } from 'react';
// Libraries
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { GoogleAuthProvider, FacebookAuthProvider, signInWithPopup, getAuth } from "firebase/auth";
// Services
import { FbAuth } from "@/app/lib/services/firebase";

interface iSignProvider{
    SignResponse: any,
    setSignResponse: React.Dispatch<React.SetStateAction<any>>,
}

const signInWithGoogle = async ({SignResponse, setSignResponse}:iSignProvider) => {
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(FbAuth, provider);
        const user = result.user;
        setSignResponse({...SignResponse, signed: 'Google', user: user});
        return user;
    } catch (error) {
        setSignResponse({...SignResponse, error: error});
        throw error;
    }
};

const signInWithFacebook = async ({SignResponse, setSignResponse}:iSignProvider) => {
    try {
        const provider = new FacebookAuthProvider();
        const result = await signInWithPopup(FbAuth, provider);
        const user = result.user;
        setSignResponse({...SignResponse, signed: 'Facebook', user: user});
        return user;
    } catch (error) {
        setSignResponse({...SignResponse, error: error});
        throw error;
    }
};

interface iSignInEmail{
    email: string,
    password: string,
    SignResponse: any,
    setSignResponse: React.Dispatch<React.SetStateAction<any>>,
}

const signInWithEmail = async ({ email, password, SignResponse, setSignResponse }:iSignInEmail) => {
    try {
        const userCredential = await signInWithEmailAndPassword(FbAuth, email, password);
        const user = userCredential.user;
        setSignResponse({...SignResponse, signed: 'Email', user: user});
        return user;
    } catch (error) {
        setSignResponse({...SignResponse, error: error});
        throw error;
    }
};

const signUpWithEmail = async ({ email, password, SignResponse, setSignResponse }:iSignInEmail) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(FbAuth, email, password);
        const user = userCredential.user;
        setSignResponse({...SignResponse, signed: 'Email', user: user});
        return user;
    } catch (error) {
        setSignResponse({...SignResponse, error: error});
        throw error;
    }
};

export { signInWithGoogle, signInWithFacebook, signInWithEmail, signUpWithEmail };

/* ─────────────────────────────────────────────────────────
DOC: Auth helpers (sign-in/out) — functionalities/CommonFunctions/SingFunc.tsx
QUÉ HACE:
  Utilidades de autenticación con Firebase Auth: inicio/cierre de sesión y proveedores sociales.
  (El nombre del archivo sugiere “Sign”, se documenta como helpers de login).

API / EXPORTS / RUTA:
  — export async function signInEmailPassword(email:string, password:string): Promise<UserCredential>
  — export async function signOutUser(): Promise<void>
  — export async function signInWithProvider(provider: "google"|"facebook"|"apple"): Promise<UserCredential>
  — (opcional) export async function sendPasswordReset(email:string): Promise<void>

USO (ejemplo completo):
  import { signInEmailPassword, signOutUser } from "@/functionalities/CommonFunctions/SingFunc";
  const cred = await signInEmailPassword("admin@demo.com","secret123");
  await signOutUser();

NOTAS CLAVE:
  — Seguridad: usar HTTPS; no loguear contraseñas; reCAPTCHA para flujos sensibles si aplica.
  — Estado: sincronizar con AppContext (UserState) tras éxito/cierre (ver UpdateUserStateFunc).
  — Privacidad: minimizar datos persistidos en storage.

DEPENDENCIAS:
  firebase/auth · "@/app/lib/services/firebase" (FbAuth)
────────────────────────────────────────────────────────── */
