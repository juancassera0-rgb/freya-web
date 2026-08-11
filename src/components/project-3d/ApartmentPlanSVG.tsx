"use client";

import type { ProjectUnit } from "@/data/project3d";
import styles from "./ApartmentPlanSVG.module.css";

type Props = {
  unit: ProjectUnit;
};

/**
 * Plano esquemático estilo arquitectónico (líneas finas, aberturas, norte,
 * cota de superficie). Generado paramétricamente a partir de la tipología —
 * placeholder de interfaz hasta contar con el plano oficial por unidad.
 */
export function ApartmentPlanSVG({ unit }: Props) {
  const ambientes = Math.max(1, parseInt(unit.typology, 10) || 2);
  const bedrooms = Math.max(1, ambientes - 1);

  // Envolvente principal
  const x0 = 18;
  const y0 = 20;
  const envW = 300;
  const envH = 190;

  // Zona social (izquierda) vs. zona privada (derecha)
  const socialW = envW * 0.56;
  const privateX = x0 + socialW;
  const privateW = envW - socialW;

  // Cocina como franja inferior de la zona social
  const kitchenH = envH * 0.32;
  const livingH = envH - kitchenH;

  // Zona privada: N dormitorios + 1 baño, apilados
  const cells = bedrooms + 1; // + baño
  const cellH = envH / cells;

  // Balcón: franja adosada al borde derecho
  const balconyW = 34;
  const balconyX = x0 + envW;

  const rooms: { x: number; y: number; w: number; h: number; label: string; sub?: string }[] = [
    { x: x0, y: y0, w: socialW, h: livingH, label: "Living / comedor" },
    { x: x0, y: y0 + livingH, w: socialW, h: kitchenH, label: "Cocina" },
  ];

  for (let i = 0; i < bedrooms; i++) {
    rooms.push({
      x: privateX,
      y: y0 + i * cellH,
      w: privateW,
      h: cellH,
      label: `Dorm. ${i + 1}`,
    });
  }
  rooms.push({
    x: privateX,
    y: y0 + bedrooms * cellH,
    w: privateW,
    h: cellH,
    label: "Baño",
  });

  const doorAt = (x: number, y: number, size = 12, rotate = 0) => (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`} className={styles.door}>
      <path d={`M0,0 L0,${size} A${size},${size} 0 0 1 ${size},0`} fill="none" />
      <line x1={0} y1={0} x2={size} y2={0} />
    </g>
  );

  return (
    <div className={styles.root}>
      <svg
        viewBox="0 0 400 260"
        className={styles.svg}
        role="img"
        aria-label={`Plano esquemático — ${unit.typology}, ${unit.surfaceM2} m²`}
      >
        {/* Envolvente exterior */}
        <rect
          x={x0}
          y={y0}
          width={envW + balconyW}
          height={envH}
          className={styles.envelope}
        />

        {/* Divisiones internas */}
        <line x1={x0} y1={y0 + livingH} x2={x0 + socialW} y2={y0 + livingH} className={styles.wall} />
        <line x1={privateX} y1={y0} x2={privateX} y2={y0 + envH} className={styles.wall} />
        {Array.from({ length: bedrooms }, (_, i) => (
          <line
            key={i}
            x1={privateX}
            y1={y0 + (i + 1) * cellH}
            x2={privateX + privateW}
            y2={y0 + (i + 1) * cellH}
            className={styles.wall}
          />
        ))}
        <line x1={x0 + envW} y1={y0} x2={x0 + envW} y2={y0 + envH} className={styles.wallLight} />

        {/* Balcón */}
        <rect
          x={balconyX}
          y={y0}
          width={balconyW}
          height={envH}
          className={styles.balcony}
        />
        <text x={balconyX + balconyW / 2} y={y0 + envH / 2} className={styles.balconyLabel} transform={`rotate(90 ${balconyX + balconyW / 2} ${y0 + envH / 2})`}>
          BALCÓN
        </text>

        {/* Aberturas (puertas) */}
        {doorAt(x0 + socialW * 0.42, y0 + livingH, 14, 0)}
        {doorAt(privateX, y0 + livingH * 0.35, 12, 90)}

        {/* Ventanas exteriores (marcas) */}
        <line x1={x0 + socialW * 0.2} y1={y0} x2={x0 + socialW * 0.5} y2={y0} className={styles.window} />
        <line x1={x0} y1={y0 + livingH * 0.3} x2={x0} y2={y0 + livingH * 0.7} className={styles.window} />

        {/* Etiquetas de ambientes */}
        {rooms.map((r, i) => (
          <g key={i}>
            <text x={r.x + r.w / 2} y={r.y + r.h / 2 - 4} className={styles.roomLabel}>
              {r.label.toUpperCase()}
            </text>
          </g>
        ))}

        {/* Norte */}
        <g className={styles.north} transform="translate(368 30)">
          <line x1="0" y1="10" x2="0" y2="-8" />
          <path d="M -4,-3 L 0,-10 L 4,-3" fill="none" />
          <text x="0" y="20">N</text>
        </g>

        {/* Cota de superficie */}
        <line x1={x0} y1={y0 + envH + 18} x2={x0 + envW + balconyW} y2={y0 + envH + 18} className={styles.dimLine} />
        <text x={x0 + (envW + balconyW) / 2} y={y0 + envH + 32} className={styles.dimLabel}>
          {unit.surfaceM2} m² totales
        </text>
      </svg>

      <p className={styles.hint}>
        Plano esquemático de interfaz — reemplazar por plano oficial de la unidad.
      </p>
    </div>
  );
}
