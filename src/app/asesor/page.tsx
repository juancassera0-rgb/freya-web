import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdvisorForm } from "@/components/AdvisorForm";
import { ScrollReveal } from "@/components/ScrollReveal";
import { getActiveProjects } from "@/data/projects";
import { site, whatsappUrl } from "@/data/site";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Hablar con un asesor",
  description:
    "Asesoramiento comercial Freya: tipologías, precios, visitas y financiación de desarrollos en comercialización.",
};

const benefits = [
  {
    title: "Disponibilidad y tipologías",
    body: "Te orientamos sobre unidades disponibles, metros y perfiles de comprador según el proyecto.",
  },
  {
    title: "Precios y condiciones",
    body: "Información comercial personalizada: valores orientativos, formas de pago y próximos pasos.",
  },
  {
    title: "Visita o reunión",
    body: "Coordinamos una llamada, WhatsApp o encuentro para recorrer el proyecto y resolver dudas.",
  },
];

export default function AsesorPage() {
  const active = getActiveProjects();

  return (
    <div className="section">
      <div className="container">
        <div className={styles.hero}>
          <ScrollReveal from="left">
            <p className="eyebrow">Asesoramiento comercial</p>
            <h1>Hablar con un asesor</h1>
            <p className="lead" style={{ marginTop: "1rem" }}>
              Canal pensado para quienes quieren avanzar con un desarrollo:
              tipologías, precios, visitas y personalización. No es el contacto
              general de la empresa.
            </p>
            <div className={styles.heroActions}>
              <a
                className={styles.ctaPrimary}
                href={whatsappUrl(
                  "Hola Freya, quiero hablar ahora con un asesor comercial.",
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp con un asesor
                <span aria-hidden>→</span>
              </a>
              <a
                className={styles.ctaText}
                href={`tel:${site.contact.phoneTel}`}
              >
                Llamar {site.contact.phoneDisplay}
              </a>
            </div>
          </ScrollReveal>

          <ScrollReveal from="right" delay={120}>
            <aside className={styles.aside}>
              <p className={styles.asideTitle}>En comercialización ahora</p>
              <ul>
                {active.map((p) => (
                  <li key={p.slug}>
                    <Link href={`/desarrollos/${p.slug}`}>
                      {p.name}
                      <span>
                        {p.neighborhood} · {p.typologies}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className={styles.asideNote}>
                Horario comercial: {site.contact.hours}
              </p>
            </aside>
          </ScrollReveal>
        </div>

        <section className={styles.benefits}>
          {benefits.map((item, i) => (
            <ScrollReveal key={item.title} delay={i * 90}>
              <article>
                <h2>{item.title}</h2>
                <p>{item.body}</p>
              </article>
            </ScrollReveal>
          ))}
        </section>

        <section className={styles.formBlock}>
          <ScrollReveal from="left">
            <p className="eyebrow">Agenda</p>
            <h2>Pedí que te contacte un asesor</h2>
            <p className="muted" style={{ marginTop: "0.75rem" }}>
              Completá el formulario y abrimos WhatsApp con tu pedido listo.
              Si buscás datos de oficina, prensa o una consulta no comercial,
              usá{" "}
              <Link href="/contacto" className={styles.inlineLink}>
                Contacto
              </Link>
              .
            </p>
          </ScrollReveal>
          <ScrollReveal from="right" delay={100}>
            <Suspense fallback={<p>Cargando formulario…</p>}>
              <AdvisorForm />
            </Suspense>
          </ScrollReveal>
        </section>
      </div>
    </div>
  );
}
