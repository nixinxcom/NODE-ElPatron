/*---------------------------------------------------------
 Type: Function
 Import:
   import CreateIDFunc from '@/functionalities/CommonFunctions/CreateIDFunc'

 interface ICreateIDs{
    InitialLetters?: string;
    EncryptionLevel: number; // 2..36 (radix)
    Complexity: number;      // >1
 }
---------------------------------------------------------*/

export interface ICreateIDs {
  InitialLetters?: string;
  EncryptionLevel: number; // Between 2 and 36 (radix)
  Complexity: number;      // Random upper bound (>1)
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function sanitizePrefix(s?: string) {
  if (!s) return "_";
  // permite letras/números/guiones/underscore; evita espacios y raros
  return s.toString().trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
}

export default function CreateIDFunc(props: ICreateIDs): string {
  const prefix = sanitizePrefix(props.InitialLetters);
  const radix = clamp(Math.floor(Math.abs(props.EncryptionLevel) || 36), 2, 36);

  // tiempo: ms + high-res si existe para reducir colisiones
  const ts = Date.now().toString(radix);
  const hires =
    typeof performance !== "undefined" && typeof performance.now === "function"
      ? Math.floor(performance.now() * 1000).toString(radix)
      : "";

  // random con crypto si hay; fallback a Math.random
  const upper = Math.max(2, Math.floor(Math.abs(props.Complexity) || 0));
  let randNum: number;
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    randNum = buf[0] % upper;
  } else {
    randNum = Math.floor(Math.random() * upper);
  }
  const rand = randNum.toString(radix);

  return `${prefix}_${ts}${hires ? hires : ""}_${rand}`;
}
// ejemplo: CreateIDFunc({InitialLetters:"usr", EncryptionLevel:16, Complexity:1000})

/* ─────────────────────────────────────────────────────────
DOC: Generación de IDs — functionalities/CommonFunctions/CreateIDFunc.tsx
QUÉ HACE:
  Provee utilidades para crear identificadores únicos legibles o compactos (ej. prefix + timestamp + random)
  y slugs seguros para URLs.

API / EXPORTS / RUTA:
  — export function createId(prefix?:string): string
      // "prefix_20250829_0f3a9c"
  — export function nanoId(len?:number): string
      // id corto aleatorio (a–z0–9)
  — export function slugify(text:string, opts?:{lower?:boolean; keep?:string[]}): string

USO (ejemplo completo):
  const orderId = createId("HTW");   // "HTW_20250829_f93ab2"
  const slug = slugify("Quesabirria Grande!"); // "quesabirria-grande"

NOTAS CLAVE:
  — Idempotencia: no reusar IDs en reintentos de pagos/órdenes; usar claves idempotentes en backend.
  — Seguridad: evitar filtrar PII dentro del ID/slug.

DEPENDENCIAS:
  (opcional) crypto.getRandomValues / Math.random; normalización Unicode
────────────────────────────────────────────────────────── */
