"use client";

import { FormEvent, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getActiveProjects, projects } from "@/data/projects";
import { site, whatsappUrl } from "@/data/site";
import styles from "./ContactForm.module.css";

type Props = {
  compact?: boolean;
  defaultProject?: string;
};

export function ContactForm({ compact = false, defaultProject }: Props) {
  const params = useSearchParams();
  const fromQuery = params.get("proyecto") ?? "";
  const initialProject = defaultProject || fromQuery;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [project, setProject] = useState(initialProject);
  const [interest, setInterest] = useState("vivir");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const options = useMemo(() => {
    const active = getActiveProjects();
    const rest = projects.filter((p) => p.status === "finalizado");
    return [...active, ...rest];
  }, []);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const projectLabel =
      options.find((p) => p.slug === project)?.name ?? "desarrollos Freya";
    const text = [
      `Hola Freya, consulta general.`,
      `Soy ${name || "un contacto"}.`,
      `Teléfono: ${phone || "a coordinar"}.`,
      project ? `Tema / proyecto: ${projectLabel}.` : "",
      `Motivo: ${interest === "vivir" ? "consulta vinculada a vivienda" : "consulta vinculada a inversión / general"}.`,
      message ? `Mensaje: ${message}` : "",
    ]
      .filter(Boolean)
      .join(" ");

    setSent(true);
    window.open(whatsappUrl(text), "_blank", "noopener,noreferrer");
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      {!compact && (
        <p className={styles.intro}>
          Para consultas generales, oficina o mensajes no comerciales. Si querés
          tipologías o precios, usá Hablar con un asesor.
        </p>
      )}

      <div className={styles.row}>
        <label className={styles.field}>
          <span>Nombre</span>
          <input
            name="name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label className={styles.field}>
          <span>WhatsApp / teléfono</span>
          <input
            name="phone"
            autoComplete="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </label>
      </div>

      <div className={styles.row}>
        <label className={styles.field}>
          <span>Proyecto de interés</span>
          <select
            name="project"
            value={project}
            onChange={(e) => setProject(e.target.value)}
          >
            <option value="">Todos / aún no sé</option>
            {options.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name} — {p.neighborhood}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span>¿Qué buscás?</span>
          <select
            name="interest"
            value={interest}
            onChange={(e) => setInterest(e.target.value)}
          >
            <option value="vivir">Comprar para vivir</option>
            <option value="invertir">Invertir</option>
          </select>
        </label>
      </div>

      {!compact && (
        <label className={styles.field}>
          <span>Mensaje (opcional)</span>
          <textarea
            name="message"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tipología, presupuesto orientativo, visita…"
          />
        </label>
      )}

      <div className={styles.actions}>
        <button type="submit" className="btn btn-primary">
          Enviar mensaje
        </button>
        <a className="btn btn-secondary" href={`mailto:${site.contact.email}`}>
          Email directo
        </a>
      </div>

      {sent && (
        <p className={styles.ok} role="status">
          Abrimos WhatsApp con tu mensaje general. Para asesoramiento comercial
          usá /asesor.
        </p>
      )}
    </form>
  );
}
