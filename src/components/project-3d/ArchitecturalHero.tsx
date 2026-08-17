"use client";

import { MaskReveal } from "@/components/experience/MaskReveal";
import { MagneticCTA } from "@/components/experience/MagneticCTA";
import { FreyaLogo } from "@/components/FreyaLogo";
import styles from "./ArchitecturalHero.module.css";

/**
 * Primera pantalla — calma en vez de escena 3D.
 *
 * Antes esta sección pineaba 260vh de scroll para animar una cámara sobre
 * un edificio 3D. El brief pide algo más silencioso: logo grande, muy poco
 * texto, una imagen quieta tratada en el verde de marca. Sin cámara, sin
 * pin de scroll — una sola pantalla que sigue de largo hacia el resto de
 * la home.
 *
 * La imagen es un stand-in (`/images/services/espacios.jpg`, ya existente
 * en el repo) — pendiente de reemplazo por fotografía de arquitectura real
 * tratada en verde, según el brief.
 */
export function ArchitecturalHero() {
  return (
    <section className={styles.root} aria-label="Freya">
      <div className={styles.image} aria-hidden />
      <div className={styles.wash} aria-hidden />

      <div className={styles.ui}>
        <MaskReveal immediate delay={120}>
          <FreyaLogo variant="hero" priority />
        </MaskReveal>

        <MaskReveal immediate delay={360}>
          <p className={styles.tagline}>
            Desarrollos residenciales · Buenos Aires
          </p>
        </MaskReveal>

        <MaskReveal immediate delay={520}>
          <MagneticCTA href="/desarrollos" variant="ghost" className={styles.cta}>
            Ver desarrollos
          </MagneticCTA>
        </MaskReveal>
      </div>
    </section>
  );
}
