// app/lib/faculties.ts
import type iSettings from "@/app/lib/settings/interface";

export type FacultyKey = keyof NonNullable<iSettings["faculties"]>;

/**
 * Verifica si un faculty está habilitado según settings efectivos.
 * Regla:
 *  - Si no hay settings/faculties => false.
 *  - Si el campo está en booleano => respeta ese valor.
 *  - Si el campo no existe => lo tomamos como habilitado (backwards compatible),
 *    pero puedes cambiarlo a false si prefieres política restrictiva.
 */
export function hasFaculty(
  settings: iSettings | null | undefined,
  key: FacultyKey
): boolean {
  const faculties = settings?.faculties;
  if (!faculties) return false;

  const val = faculties[key];
  if (typeof val === "boolean") return val;

  // Comportamiento por defecto para keys no definidas explícitamente:
  return true;
}

/**
 * Para usar en endpoints sensibles del lado servidor:
 * lanza 403 si el faculty NO está habilitado.
 */
export function ensureFaculty(
  settings: iSettings | null | undefined,
  key: FacultyKey
) {
  if (!hasFaculty(settings, key)) {
    const err: any = new Error(`Faculty "${key}" is not enabled for this tenant`);
    err.statusCode = 403;
    throw err;
  }
}
