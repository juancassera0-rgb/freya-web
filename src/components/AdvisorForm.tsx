"use client";

import { FormEvent, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getActiveProjects } from "@/data/projects";
import { whatsappUrl } from "@/data/site";
import styles from "./ContactForm.module.css";

type Props = {
  defaultProject?: string;
};

export function AdvisorForm({ defaultProject }: Props) {
  const params = useSearchParams();
  const fromQuery = params.get("proyecto") ?? "";
  const initialProject = defaultProject || fromQuery;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [project, setProject] = useState(initialProject);
  const [interest, setInterest] = useState("vivir");
  const [channel, setChannel] = useState("whatsapp");
  const [slot, setSlot] = useState("manana");
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);

  const options = useMemo(() => getActiveProjects(), []);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const projectLabel =
      options.find((p) => p.slug === project)?.name ?? "desarrollos en venta";
    const channelLabel =
      channel === "visita"
        ? "visita / reunión"
        : channel === "llamada"
          ? "llamada telefónica"
          : "WhatsApp";
    const slotLabel =
      slot === "tarde" ? "tarde" : slot === "flexible" ? "horario flexible" : "mañana";

    const text = [
      `Hola Freya, quiero hablar con un asesor.`,
      `Soy ${name || "un interesado"}.`,
      `Teléfono/WhatsApp: ${phone || "a coordinar"}.`,
      `Proyecto: ${projectLabel}.`,
      `Objetivo: ${interest === "vivir" ? "comprar para vivir" : "inversión"}.`,
      `Prefiero: ${channelLabel}.`,
      `Franja: ${slotLabel}.`,
      note ? `Detalle: ${note}` : "",
    ]
      .filter(Boolean)
      .join(" ");

    setSent(true);
    window.open(whatsappUrl(text), "_blank", "noopener,noreferrer");
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <p className={styles.intro}>
        Coordinamos una conversación comercial: tipologías, disponibilidad,
        precios orientativos y próximos pasos.
      </p>

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
          <span>Proyecto</span>
          <select
            name="project"
            value={project}
            onChange={(e) => setProject(e.target.value)}
          >
            <option value="">Quiero orientación general</option>
            {options.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name} — {p.neighborhood}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span>Objetivo</span>
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

      <div className={styles.row}>
        <label className={styles.field}>
          <span>¿Cómo preferís hablar?</span>
          <select
            name="channel"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
          >
            <option value="whatsapp">WhatsApp ahora</option>
            <option value="llamada">Llamada con un asesor</option>
            <option value="visita">Visita / reunión presencial</option>
          </select>
        </label>
        <label className={styles.field}>
          <span>Franja horaria</span>
          <select
            name="slot"
            value={slot}
            onChange={(e) => setSlot(e.target.value)}
          >
            <option value="manana">Mañana</option>
            <option value="tarde">Tarde</option>
            <option value="flexible">Flexible</option>
          </select>
        </label>
      </div>

      <label className={styles.field}>
        <span>Qué necesitás saber</span>
        <textarea
          name="note"
          rows={4}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ej: tipología 4 ambientes, financiación, visita a showroom…"
        />
      </label>

      <div className={styles.actions}>
        <button type="submit" className="btn btn-primary">
          Pedir asesoramiento
        </button>
        <a
          className="btn btn-whatsapp"
          href={whatsappUrl(
            "Hola Freya, quiero hablar ahora con un asesor comercial.",
          )}
          target="_blank"
          rel="noopener noreferrer"
        >
          WhatsApp directo
        </a>
      </div>

      {sent && (
        <p className={styles.ok} role="status">
          Abrimos WhatsApp con tu pedido de asesoramiento.
        </p>
      )}
    </form>
  );
}
