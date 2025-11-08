import type { ReactNode } from "react";
import styles from "./page.module.css";

type OrgLayoutProps = {
  children: ReactNode;
  params: Promise<{
    locale: string; // SOLO locale acá
  }>;
};

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
  const { locale } = await params;

  return (
    <main className={styles.orgMain}>
      <header className={styles.orgHeader}>
        <h1 className={styles.orgTitle}>NIXINX.org</h1>
        <p className={styles.orgSubtitle}>
          Zona organización · <span>{locale.toUpperCase()}</span>
        </p>
      </header>
      <section className={styles.orgContent}>{children}</section>
    </main>
  );
}
