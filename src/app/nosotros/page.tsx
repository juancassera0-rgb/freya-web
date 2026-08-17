import type { Metadata } from "next";
import Link from "next/link";
import { StatsCounters } from "@/components/AnimatedCounter";
import { ScrollReveal } from "@/components/ScrollReveal";
import { site } from "@/data/site";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Nosotros",
  description:
    "Trayectoria de Freya: más de 20 años desde Pinamar hasta desarrollos residenciales en Buenos Aires.",
};

export default function NosotrosPage() {
  return (
    <div className="section">
      <div className="container">
        <ScrollReveal>
          <p className="eyebrow">La desarrolladora</p>
          <h1>Trayectoria que se puede contar con obras</h1>
          <p className="lead" style={{ marginTop: "1rem" }}>
            Hace más de 20 años dimos los primeros pasos en Pinamar con complejos
            residenciales. Con el tiempo crecimos en escala y llegamos a Buenos
            Aires —principalmente Caballito y alrededores— con edificios de más de
            2.800 m².
          </p>
        </ScrollReveal>

        <div className={`grid-2 ${styles.block}`}>
          <ScrollReveal from="left">
            <article className={styles.card}>
              <h2>De Pinamar a la ciudad</h2>
              <p>
                La expansión a CABA consolidó la experiencia en tipologías
                urbanas. Hoy seguimos desarrollando en esa área, con mirada a
                nuevas zonas y proyectos de mayor envergadura, manteniendo una
                filosofía simple: calidad constructiva, diseño y visión a largo
                plazo.
              </p>
            </article>
          </ScrollReveal>
          <ScrollReveal from="right" delay={120}>
            <article className={styles.card}>
              <h2>Para quién construimos</h2>
              <p>
                Equilibramos las necesidades de quienes habitan los espacios y de
                quienes invierten. Cada obra busca generar valor en el tiempo —
                no solo entregar metros cuadrados.
              </p>
            </article>
          </ScrollReveal>
        </div>

        <ScrollReveal>
          <section className={styles.stats}>
            <StatsCounters
              stats={site.stats}
              className={styles.statsGrid}
              valueClassName={styles.value}
              labelClassName={styles.label}
            />
          </section>
        </ScrollReveal>

        <ScrollReveal delay={80}>
          <section className={styles.cta}>
            <h2>Conocé lo que estamos desarrollando ahora</h2>
            <div className={styles.ctaLinks}>
              <Link className={styles.ctaPrimary} href="/desarrollos">
                Ver desarrollos
                <span aria-hidden>→</span>
              </Link>
            </div>
          </section>
        </ScrollReveal>
      </div>
    </div>
  );
}
