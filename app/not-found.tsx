'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import styles from './NotFound.module.css';
import SecretAdminTrigger from '@/complements/components/SecretAdminTrigger';
import { BUTTON, LINK, NEXTIMAGE, IMAGE, DIV, A, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";

type Locale = 'es' | 'en' | 'fr';

// 🔗 Rutas “reales” por locale (ajústalas a tu instalación)
const LINKS: Record<Locale, Array<{ href: string; label: string }>> = {
  es: [
    { href: '/es', label: 'Inicio' },
    { href: '/es/home', label: 'Home' },
    { href: '/es/reservas', label: 'Reservas' },
    { href: '/es/blog', label: 'Blog' },
    { href: '/es/menu', label: 'Menú' },
    { href: '/es/galeria', label: 'Galería' },
    { href: '/es/about-us', label: 'Sobre nosotros' },
  ],
  en: [
    { href: '/en', label: 'Home' },
    { href: '/en/home', label: 'Home (alt)' },
    { href: '/en/reservas', label: 'Reservations' },
    { href: '/en/blog', label: 'Blog' },
    { href: '/en/menu', label: 'Menu' },
    { href: '/en/galeria', label: 'Gallery' },
    { href: '/en/about-us', label: 'About us' },
  ],
  fr: [
    { href: '/fr', label: 'Accueil' },
    { href: '/fr/home', label: 'Accueil (alt)' },
    { href: '/fr/reservas', label: 'Réservations' },
    { href: '/fr/blog', label: 'Blog' },
    { href: '/fr/menu', label: 'Menu' },
    { href: '/fr/galeria', label: 'Galerie' },
    { href: '/fr/about-us', label: 'À propos' },
  ],
};

const TEXTS: Record<Locale, any> = {
  es: {
    title: 'Página no encontrada',
    desc: 'La página que buscabas no existe o cambió de lugar.',
    searchPh: 'Buscar…',
    popular: 'Páginas disponibles',
    backHome: 'Volver al inicio',
    auto: (s: number) => `Te redirigiremos en ${s}s…`,
    cancel: 'Cancelar redirección',
    deactivated: 'Redirección desactivada.',
  },
  en: {
    title: 'Page not found',
    desc: 'The page you were looking for does not exist or moved.',
    searchPh: 'Search…',
    popular: 'Available pages',
    backHome: 'Back to home',
    auto: (s: number) => `Redirecting in ${s}s…`,
    cancel: 'Cancel redirect',
    deactivated: 'Redirect deactivated.',
  },
  fr: {
    title: 'Page introuvable',
    desc: 'La page demandée n’existe pas ou a été déplacée.',
    searchPh: 'Rechercher…',
    popular: 'Pages disponibles',
    backHome: 'Retour à l’accueil',
    auto: (s: number) => `Redirection dans ${s}s…`,
    cancel: 'Annuler la redirection',
    deactivated: 'Redirection désactivée.',
  },
};

export default function NotFound() {
  const pathname = usePathname() || '/';
  const router = useRouter();

  const locale = useMemo<Locale>(() => {
    const seg = pathname.split('/')[1];
    return (['es', 'en', 'fr'].includes(seg) ? seg : 'es') as Locale;
  }, [pathname]);

  const [query, setQuery] = useState('');
  const [autoRedirect, setAutoRedirect] = useState(true);
  const [seconds, setSeconds] = useState(10);

  // Detener redirección en el primer gesto del usuario
  useEffect(() => {
    if (!autoRedirect) return;
    const stop = () => setAutoRedirect(false);
    window.addEventListener('keydown', stop);
    window.addEventListener('pointerdown', stop, { passive: true } as any);
    return () => {
      window.removeEventListener('keydown', stop);
      window.removeEventListener('pointerdown', stop as any);
    };
  }, [autoRedirect]);

  // Countdown → redirect al home del locale
  useEffect(() => {
    if (!autoRedirect) return;
    const id = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [autoRedirect]);

  useEffect(() => {
    if (autoRedirect && seconds <= 0) router.replace(`/${locale}`);
  }, [seconds, autoRedirect, router, locale]);

  const links = LINKS[locale] ?? LINKS.es;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return links;
    return links.filter(
      (l) => l.label.toLowerCase().includes(q) || l.href.toLowerCase().includes(q)
    );
  }, [links, query]);

  const t = TEXTS[locale];

  return (
    <main className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>404 — {t.title}</h1>
        <p className={styles.subtitle}>{t.desc}</p>

        {/* Buscador */}
        <div className={styles.searchRow}>
          <input
            className={styles.search}
            type="search"
            placeholder={t.searchPh}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <LINK className={styles.homeBtn} href={`/${locale}`}>
            {t.backHome}
          </LINK>
        </div>

        {/* Auto redirect */}
        <div className={styles.autoRow}>
          {autoRedirect ? (
            <>
              <span className={styles.muted}>{t.auto(seconds)}</span>
              <BUTTON className={styles.cancelBtn} onClick={() => setAutoRedirect(false)}>
                {t.cancel}
              </BUTTON>
            </>
          ) : (
            <span className={styles.muted}>{t.deactivated}</span>
          )}
        </div>

        {/* Links disponibles */}
        <h2 className={styles.sectionTitle}>{t.popular}</h2>
        <nav className={styles.grid}>
          {filtered.map((l) => (
            <LINK key={l.href} href={l.href} className={styles.linkItem}>
              <span className={styles.linkLabel}>{l.label}</span>
              <span className={styles.linkPath}>{l.href}</span>
            </LINK>
          ))}
        </nav>
      </div>
      <SecretAdminTrigger/>
    </main>
  );
}
