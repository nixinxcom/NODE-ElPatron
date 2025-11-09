// app/page.tsx
import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <span className={styles.badge}>Windsor • Flagship Location</span>
        <h1>Hot Tacos Windsor</h1>
        <p>
          Street-style tacos, margaritas bien frías y el spot perfecto antes o después del casino
          y el downtown.
        </p>
        <div className={styles.actions}>
          <a href="#menu" className={styles.primary}>
            Ver menú
          </a>
          <a href="#visit" className={styles.secondary}>
            Cómo llegar
          </a>
        </div>
      </section>

      <section id="menu" className={styles.grid}>
        <div>
          <h2>Tacos insignia</h2>
          <ul>
            <li>Birria clásica con consomé</li>
            <li>Al pastor con piña asada</li>
            <li>Crispy Baja Fish</li>
          </ul>
        </div>
        <div>
          <h2>Por qué Windsor</h2>
          <p>
            Nuestra cocina abierta, barra visible y servicio rápido marcan el estilo original Hot
            Tacos en Canadá. Punto de encuentro para crew local y visitors.
          </p>
        </div>
      </section>

      <section id="visit" className={styles.visit}>
        <h2>Visítanos</h2>
        <p>123 Riverside Dr, Windsor, ON · Todos los días 11:00–23:00</p>
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
