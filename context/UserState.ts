'use client'
import { iEnvironment } from './EnvironmentInterface';

const UserState:iEnvironment = {
    User:{
            DefaultID: null,
            ClientID: null,
            SignUpDate: [],
            FirstName: null,
            LastName: null,
            Birthday: {
                year: null,
                month: null,
                day: null
            },
            Email: null,
            Phone: null,
            SIN: null,
            TaxID: null,
            Lang1: null,
            Lang2: null,
            Currency: null
        },
    Geo:{
            GLat: null,
            GLng: null,
            GAproach: 70,
            StartNavTime: null,
            GLinkURL: null,
            DetailGeolocation: null,
        },
    Digital:{
            Website: null,
            SocialMedia: [],
            Chat: [],
            Navigator: null,
            DarkMode: null,
            Cookies: null,
            CookiesSaved: []
        },
    Company:{
            Name: null,
            Brand: null,
            Logo: null,
            Slogan: null,
            BackgroundColor: null,
            FontColor: null
        },
    Membership:{
            Status: null,
            Category: null,
            Balance: 0,
            eStatements: false,
            MonthsDue: 0
        },
    Access:{
            Authenticated: null,
            StartNavTime: [],
            Alerts: []
        },
    Stickys:{
            Favorites: []
        },
    States: {
            // State1: true,
        },
    setStates: {
            // setState1: setTestState,
        },
    Languages: {
            // Idiomas disponibles
        },
    UsrLocal: null,
    AiModel: {
        model: 'gpt-5-nano'
    },
};

export { UserState };

/* ─────────────────────────────────────────────────────────
DOC: Tipos de usuario/estado — context/UserState.ts
QUÉ HACE:
  Declara la forma del usuario autenticado y preferencias guardadas, para uso en AppContext
  y funciones de actualización.

API / EXPORTS / RUTA:
  — export type Role = "guest"|"user"|"staff"|"admin"
  — export interface Claims {
      roles?: Role[]; email_verified?: boolean; provider?: string; [k:string]: any
    }
  — export interface UserState {
      uid: string
      email?: string | null
      displayName?: string | null
      photoURL?: string | null
      phoneNumber?: string | null
      claims?: Claims
      createdAt?: string | number
      lastLoginAt?: string | number
      prefs?: { locale?: "es"|"en"|"fr"; theme?: "light"|"dark"|"system" }
    }
  — export const anonymousUser: UserState

USO (ejemplo completo):
  import type { UserState } from "@/context/UserState";
  const u: UserState = { uid: "abc123", email: "admin@demo.com", claims:{ roles:["admin"] } };

NOTAS CLAVE:
  — Seguridad: roles/claims deben venir de verificación server (Firebase Admin o backend propio).
  — Privacidad: limitar PII; no persistir más de lo necesario en local/session storage.
  — i18n: prefs.locale ayuda a inicializar idioma.

DEPENDENCIAS:
  Ninguna (solo tipos)
────────────────────────────────────────────────────────── */
