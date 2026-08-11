"use client";

import type { Project } from "@/data/projects";
import { CountedText } from "@/components/AnimatedCounter";
import styles from "./ProjectFacts.module.css";
import type { ReactNode } from "react";

type FactItem = {
  label: string;
  value: ReactNode;
  href?: string;
  action?: string;
  accent?: boolean;
  badge?: boolean;
  countText?: string;
};

type Props = {
  project: Project;
  statusLabel: string;
};

export function ProjectFacts({ project, statusLabel }: Props) {
  const mapQuery = encodeURIComponent(
    `${project.location}, ${project.neighborhood}, ${project.city}`,
  );
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

  const items: FactItem[] = [
    {
      label: "Ubicación",
      value: (
        <>
          {project.location}
          <br />
          {project.neighborhood}, {project.city}
        </>
      ),
      href: mapUrl,
      action: "Ver en mapa",
      accent: true,
    },
    { label: "Tipo", value: project.type },
    {
      label: "Tipologías",
      value: <CountedText text={project.typologies} />,
      countText: project.typologies,
    },
    {
      label: "Superficies",
      value: <CountedText text={project.surfaces} />,
      countText: project.surfaces,
    },
  ];

  if (project.floors) {
    items.push({
      label: "Pisos",
      value: <CountedText text={project.floors} />,
      countText: project.floors,
    });
  }
  if (project.units) {
    items.push({
      label: "Unidades",
      value: <CountedText text={project.units} />,
      countText: project.units,
    });
  }

  items.push(
    { label: "Estado", value: statusLabel, badge: true },
    { label: "Perfil", value: project.buyerProfile },
  );

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
