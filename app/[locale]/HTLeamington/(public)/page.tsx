// app/page.tsx
import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <span className={styles.badge}>Leamington • Greenhouse District</span>
        <h1>Hot Tacos Leamington</h1>
        <p>
          Tacos hechos con lo mejor de los invernaderos locales, terraza luminosa y vibes más
          relajadas para la familia.
        </p>
        <div className={styles.actions}>
          <a href="#menu" className={styles.primary}>
            Ver menú especial Leamington
          </a>
          <a href="#visit" className={styles.secondary}>
            Ubicación & horarios
          </a>
        </div>
      </section>

      <section id="menu" className={styles.grid}>
        <div>
          <h2>Tacos de la casa</h2>
          <ul>
            <li>Veggie Greenhouse con salsa de habanero suave</li>
            <li>Chicken Lime Ranch</li>
            <li>Smoky Brisket con pico de gallo fresco</li>
          </ul>
        </div>
        <div>
          <h2>El mood Leamington</h2>
          <p>
            Más luz natural, más verde, más tiempo para quedarse. Perfecto para familias, after work
            y turistas que vienen por la ruta del tomate.
          </p>
        </div>
      </section>

      <section id="visit" className={styles.visit}>
        <h2>Visítanos</h2>
        <p>456 Main St, Leamington, ON · Dom–Jue 11:00–21:00 · Vie–Sáb 11:00–23:00</p>
        <a
          href="https://maps.google.com"
          target="_blank"
          rel="noreferrer"
          className={styles.map}
        >
          Ver en Google Maps
        </a>
      </section>
    </main>
  );
}
