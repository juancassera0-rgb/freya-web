import type { Metadata } from "next";
import Link from "next/link";
import { ScrollReveal } from "@/components/ScrollReveal";
import { TextReveal } from "@/components/TextReveal";
import { MethodPinned } from "@/components/MethodPinned";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Cómo trabajamos",
  description:
    "Compra de lotes, desarrollo, personalización de unidades y acompañamiento hasta la escritura.",
};

export default function ComoTrabajamosPage() {
  return (
    <>
      <div className={`section ${styles.intro}`}>
        <div className="container">
          <ScrollReveal>
            <p className="eyebrow">Método</p>
            <TextReveal as="h1">Cómo trabajamos</TextReveal>
            <p className="lead" style={{ marginTop: "0.85rem" }}>
              Cuatro etapas claras — desde el lote hasta la escritura — con
              personalización como diferencial real.
            </p>
          </ScrollReveal>
        </div>
      </div>

      <MethodPinned />

      <div className="section">
        <div className="container">
          <ScrollReveal>
            <section className={styles.banner}>
              <h2>Una identidad viva que se adapta desde el principio</h2>
              <p>
                Personalizá materiales y terminaciones con acompañamiento dedicado.
              </p>
              <div className={styles.bannerLinks}>
                <Link className={styles.bannerPrimary} href="/desarrollos">
                  Ver proyectos
                  <span aria-hidden>→</span>
                </Link>
              </div>
            </section>
          </ScrollReveal>
        </div>
      </div>
    </>
  );
}
