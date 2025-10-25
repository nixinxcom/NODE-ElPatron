interface iCookie {
    name: string, // Nombre de la cookie
    value: any, // Valor de la cookie
    DaysToExpire?: number // Dias que durará la cookie
  }
  
  function setCookie(props: iCookie) {
    const { name, value, DaysToExpire } = props;
    const CurrDate = new Date();
    
    if (DaysToExpire) {
      CurrDate.setTime(CurrDate.getTime() + DaysToExpire * 24 * 60 * 60 * 1000);
    }
  
    const ExpDate = "expires=" + CurrDate.toUTCString();
    document.cookie = `${name}=${value};${ExpDate};path=/`; // Cookie para HTTP
    document.cookie = `${name}=${value};${ExpDate};path=/; Secure`; // Cookie para HTTPS
  }
  
  function getCookie(name: string): string {
    const nm = name + "=";
    const CookieArray = document.cookie.split(';');
  
    for (let i = 0; i < CookieArray.length; i++) {
      let c = CookieArray[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(nm) == 0) {
        return c.substring(nm.length, c.length);
      }
    }
    return "";
  }
  
  function modifyCookie() {
    const name = prompt("Nombre de la cookie?");
    const value = prompt("Valor de la cookie?");
    const DaysToExpire = parseInt(prompt("Días de vigencia de la cookie?") || '0', 10);
  
    if (name && value) {
      setCookie({ name, value, DaysToExpire });
      watchCookies();
    }
  }
  
  function deleteCookie(name: string) {
    setCookie({ name, value: "", DaysToExpire: -1 });
  }
  
  function watchCookies() {
    alert("Cookies:\n" + document.cookie);
  }
  
  function readCookie() {
    const name = prompt('Nombre de la cookie');
    if (name) {
      const result = getCookie(name);
      alert(result);
    }
  }
  
  function OnDemandDeleteCookie() {
    const name = prompt("Nombre de la cookie a borrar");
    if (name) {
      deleteCookie(name);
      watchCookies();
    }
  }
  
  export { setCookie, getCookie, modifyCookie, deleteCookie, watchCookies, readCookie, OnDemandDeleteCookie };

  /* ─────────────────────────────────────────────────────────
DOC: Helpers de Cookies — functionalities/CommonFunctions/CookiesFunc.tsx
QUÉ HACE:
  Encapsula lectura/escritura/borrado de cookies con opciones (path, maxAge, sameSite, secure)
  y soporte SSR/CSR.

API / EXPORTS / RUTA:
  — export function getCookie(name:string, req?: IncomingMessage): string | null
  — export function setCookie(name:string, value:string, options?: {
        days?: number; path?: string; sameSite?: "lax"|"strict"|"none"; secure?: boolean; domain?: string
      }): void
  — export function deleteCookie(name:string, options?: { path?:string; domain?:string }): void

USO (ejemplo completo):
  // Tipo | opcional | valores permitidos | default
  setCookie("locale", "es", { days: 365, sameSite: "lax", secure: true });
  const lang = getCookie("locale");

NOTAS CLAVE:
  — Seguridad: usar Secure + SameSite=lax/strict; evitar PII; para tokens usa HttpOnly desde servidor.
  — SSR: en handlers server, leer desde headers; en cliente, document.cookie.
  — i18n: cookie "locale" útil para recordar idioma.

DEPENDENCIAS:
  (opcional) types de Node para SSR; APIs nativas document.cookie
────────────────────────────────────────────────────────── */
