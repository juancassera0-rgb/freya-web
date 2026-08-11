import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ContactForm } from "@/components/ContactForm";
import { ScrollReveal } from "@/components/ScrollReveal";
import { site } from "@/data/site";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Datos de Freya: oficina, email, teléfono y consultas generales. Para asesoramiento comercial usá Hablar con un asesor.",
};

export default function ContactoPage() {
  return (
    <div className="section">
      <div className="container grid-2">
        <div>
          <ScrollReveal>
            <p className="eyebrow">Contacto institucional</p>
            <h1>Contacto</h1>
            <p className="lead" style={{ marginTop: "1rem" }}>
              Canal para consultas generales, datos de oficina, proveedores o
              mensajes no comerciales. Si querés tipologías, precios o una visita,
              andá a{" "}
              <Link href="/asesor" className={styles.inlineLink}>
                Hablar con un asesor
              </Link>
              .
            </p>
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <ul className={styles.channels}>
              <li>
                <span>Email</span>
                <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>
              </li>
              <li>
                <span>Teléfono</span>
                <a href={`tel:${site.contact.phoneTel}`}>
                  {site.contact.phoneDisplay}
                </a>
              </li>
              <li>
                <span>Oficina</span>
                <span>{site.contact.address}</span>
              </li>
              <li>
                <span>Horario</span>
                <span>{site.contact.hours}</span>
              </li>
            </ul>
          </ScrollReveal>

          <ScrollReveal delay={140}>
            <div className={styles.splitCard}>
              <p className={styles.splitTitle}>¿Buscás comprar o invertir?</p>
              <p>
                El equipo comercial te responde por tipologías, disponibilidad y
                visitas.
              </p>
              <Link className={styles.ctaLink} href="/asesor">
                Hablar con un asesor
                <span aria-hidden>→</span>
              </Link>
            </div>
          </ScrollReveal>
        </div>

        <ScrollReveal from="right" delay={100}>
          <p className={styles.formTitle}>Mensaje general</p>
          <Suspense fallback={<p>Cargando formulario…</p>}>
            <ContactForm />
          </Suspense>
        </ScrollReveal>
      </div>
    </div>
  );
}
