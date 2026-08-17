"use client";

import type { Project } from "@/data/projects";
import styles from "./ProjectFacts.module.css";
import type { ReactNode } from "react";

type FactItem = {
  label: string;
  value: ReactNode;
  href?: string;
  action?: string;
  accent?: boolean;
  badge?: boolean;
};

type Props = {
  project: Project;
  statusLabel: string;
};

/**
 * Ficha sin datos "tipo inmobiliaria" (metros, ambientes, pisos) — solo lo
 * que pide la marca: barrio, estado de obra y cuadrados disponibles.
 */
export function ProjectFacts({ project, statusLabel }: Props) {
  const mapQuery = encodeURIComponent(
    `${project.location}, ${project.neighborhood}, ${project.city}`,
  );
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

  const items: FactItem[] = [
    {
      label: "Barrio",
      value: (
        <>
          {project.neighborhood}
          <br />
          {project.city}
        </>
      ),
      href: mapUrl,
      action: "Ver en mapa",
      accent: true,
    },
    { label: "Estado", value: statusLabel, badge: true },
  ];

  if (project.stage) {
    items.push({ label: "Obra", value: project.stage });
  }
  if (project.squaresAvailable) {
    items.push({ label: "Cuadrados", value: project.squaresAvailable });
  }

  return (
    <div className={styles.wrap}>
      {items.map((item) => {
        const content = (
          <>
            <span className={styles.label}>{item.label}</span>
            <span className={styles.value}>{item.value}</span>
            {item.action ? (
              <span className={styles.action}>{item.action}</span>
            ) : null}
          </>
        );

        if (item.href) {
          return (
            <a
              key={item.label}
              className={styles.cell}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              data-accent={item.accent ? "true" : "false"}
            >
              {content}
            </a>
          );
        }

        return (
          <div
            key={item.label}
            className={styles.cell}
            data-badge={item.badge ? "true" : "false"}
            tabIndex={0}
          >
            {content}
          </div>
        );
      })}
    </div>
  );
}
