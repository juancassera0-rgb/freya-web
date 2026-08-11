import type { Metadata } from "next";
import { ScrollReveal } from "@/components/ScrollReveal";
import { TextReveal } from "@/components/TextReveal";
import { ProjectRail } from "@/components/ProjectRail";
import {
  getActiveProjects,
  getFinishedProjects,
} from "@/data/projects";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Desarrollos",
  description:
    "Proyectos en comercialización y finalizados de Freya en Caballito, Saavedra, Villa Devoto y Pinamar.",
};

export default function DesarrollosPage() {
  const active = getActiveProjects();
  const finished = getFinishedProjects();

  return (
    <div className={`section ${styles.page}`}>
      <div className="container">
        <ScrollReveal>
          <p className="eyebrow">Portafolio</p>
          <TextReveal as="h1">Desarrollos</TextReveal>
          <p className="lead" style={{ marginTop: "0.85rem" }}>
            Lo que está en venta hoy, y lo ya entregado como respaldo de
            ejecución.
          </p>
        </ScrollReveal>
      </div>

      <section className={styles.block}>
        <div className="container">
          <ScrollReveal>
            <h2>En comercialización</h2>
            <p className={styles.blockLead}>
              Unidades disponibles para vivir o invertir, con asesoramiento
              comercial.
            </p>
          </ScrollReveal>
        </div>
        <ProjectRail projects={active} />
      </section>

      <section className={styles.block}>
        <div className="container">
          <ScrollReveal>
            <h2>Finalizados</h2>
            <p className={styles.blockLead}>
              Obras entregadas que muestran la trayectoria y calidad constructiva
              de Freya.
            </p>
          </ScrollReveal>
        </div>
        <ProjectRail projects={finished} finished />
      </section>
    </div>
  );
}
