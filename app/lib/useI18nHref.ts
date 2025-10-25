'use client';
import { usePathname, useSearchParams } from 'next/navigation';

const LOCALES = ['es','en','fr'] as const;
type L = typeof LOCALES[number];

function stripLocale(path: string): [L | null, string] {
  const clean = path.split('?')[0].split('#')[0];
  const seg = clean.split('/')[1];
  if (LOCALES.includes(seg as any)) return [seg as L, clean.slice(3) || '/'];
  return [null, clean || '/'];
}

export function useI18nHref() {
  const pathname = usePathname() || '/';
  const qs = useSearchParams();

  return (href: string, force?: L) => {
    if (!href) href = '/';
    // externo: deja tal cual
    if (/^(?:[a-z]+:)?\/\//i.test(href) || href.startsWith('mailto:') || href.startsWith('tel:')) return href;

    const input = href.startsWith('/') ? href : `/${href}`;

    // locale actual de la URL donde estamos
    const currentSeg = pathname.split('/')[1];
    const currentLocale = (LOCALES.includes(currentSeg as any) ? (currentSeg as L) : null);

    // limpia posible locale en el href (si viene "/es/galeria")
    const [hrefLocale, cleanHref] = stripLocale(input);

    // prioridad: forzado > actual > el del href > 'es'
    const locale = (force ?? currentLocale ?? hrefLocale ?? 'es') as L;

    const normalized = cleanHref === '/' ? '' : cleanHref;
    const query = qs && qs.toString() ? `?${qs}` : '';
    const hash = typeof window !== 'undefined' && window.location.hash ? window.location.hash : '';
    return `/${locale}${normalized}${query}${hash}`;
  };
}