// Tipos base
export type ShortLocale = 'es' | 'en' | 'fr';

// Resolver largo “agnóstico” (ya lo tenías, lo dejo por si lo usas en otros lados)
export function resolveLocale(input?: string | null): string {
  return (
    (input ?? undefined) ??
    process.env.NEXT_PUBLIC_DEFAULT_LOCALE ??
    (process.env.LC_ALL ||
      process.env.LC_MESSAGES ||
      process.env.LANG ||
      process.env.LANGUAGE)?.replace('.UTF-8', '').replace('_', '-') ??
    (typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().locale
      : undefined) ??
    'en-US'
  );
}

// Normaliza a corto: acepta corto o largo y devuelve 'es' | 'en' | 'fr'
export function toShortLocale(input?: string | null): ShortLocale {
  const raw = (input ?? process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? resolveLocale() ?? 'es').toString().toLowerCase();
  if (raw.startsWith('en')) return 'en';
  if (raw.startsWith('fr')) return 'fr';
  return 'es';
}

// Constante reutilizable: el default corto “desde env”
export const DEFAULT_LOCALE_SHORT: ShortLocale = toShortLocale(process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? null);

export type Locale = ShortLocale;            // <- para imports antiguos: { Locale }
export const toShort = toShortLocale;        // <- para imports antiguos: { toShort }