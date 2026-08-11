import type { Metadata } from "next";
import Link from "next/link";
import { FaqList } from "@/components/FaqList";
import { ScrollReveal } from "@/components/ScrollReveal";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description:
    "FAQ sobre desarrollos Freya: personalización, precios, visitas y zonas.",
};

export default function FaqPage() {
  return (
    <div className="section">
      <div className={`container ${styles.wrap}`}>
        <ScrollReveal>
          <p className="eyebrow">Ayuda</p>
          <h1>Preguntas frecuentes</h1>
          <p className="lead" style={{ marginTop: "0.85rem", marginBottom: "2rem" }}>
            Respuestas directas para compradores e inversores. Si no está tu duda,
            escribinos.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={80}>
          <FaqList />
        </ScrollReveal>

        <ScrollReveal delay={120}>
          <div className={styles.actions}>
            <Link className={styles.ctaPrimary} href="/asesor">
              Hablar con un asesor
              <span aria-hidden>→</span>
            </Link>
            <Link className={styles.ctaText} href="/contacto">
              Contacto general
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
