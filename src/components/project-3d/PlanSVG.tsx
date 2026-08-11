"use client";

import type { PlanRoom, UnitPlan } from "@/data/planGeometry";
import type { ProjectUnit } from "@/data/project3d";
import styles from "./PlanSVG.module.css";

type Props = {
  plan: UnitPlan;
  unit: ProjectUnit;
  activeRoomId: string | null;
  onHoverRoom?: (id: string | null) => void;
  onSelectRoom?: (room: PlanRoom) => void;
  /** Atenúa el dibujo mientras el morph avanza hacia el 3D */
  fade?: number;
};

const VB_W = 420;
const VB_H = 280;
const PAD = 26;

/**
 * Plano técnico generado desde la MISMA geometría que la planta 3D.
 * Comparte rectángulos, ambientes y estados de hover con FloorPlate3D.
 */
export function PlanSVG({
  plan,
  unit,
  activeRoomId,
  onHoverRoom,
  onSelectRoom,
  fade = 0,
}: Props) {
  // Envolvente principal + franja de balcón
  const totalW = 1 + plan.balconyWidth;
  const drawW = VB_W - PAD * 2;
  const drawH = VB_H - PAD * 2 - 26;
  const scaleX = drawW / totalW;
  const scaleY = drawH;

  const px = (x: number) => PAD + x * scaleX;
  const py = (y: number) => PAD + y * scaleY;

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      className={styles.svg}
      style={{ opacity: 1 - fade * 0.85 }}
      role="img"
      aria-label={`Plano esquemático de la unidad ${unit.code} — ${unit.typology}, ${unit.surfaceM2} m²`}
    >
      {/* Trama de fondo tipo papel técnico */}
      <defs>
        <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M 10 0 L 0 0 0 10" fill="none" className={styles.gridLine} />
        </pattern>
      </defs>
      <rect
        x={PAD}
        y={PAD}
        width={scaleX * totalW}
        height={scaleY}
        fill="url(#grid)"
        opacity="0.45"
      />

      {/* Ambientes */}
      {plan.rooms.map((room) => {
        const active = activeRoomId === room.id;
        const hasRender = Boolean(room.renderSrc);
        const x = px(room.x);
        const y = py(room.y);
        const w = room.w * scaleX;
        const h = room.h * scaleY;

        return (
          <g
            key={room.id}
            className={styles.room}
            data-active={active ? "true" : "false"}
            data-kind={room.kind}
            data-clickable={onSelectRoom ? "true" : "false"}
            onPointerEnter={() => onHoverRoom?.(room.id)}
            onPointerLeave={() => onHoverRoom?.(null)}
            onClick={() => onSelectRoom?.(room)}
          >
            <rect x={x} y={y} width={w} height={h} className={styles.roomFill} />
            <text
              x={x + w / 2}
              y={y + h / 2}
              className={styles.roomLabel}
              dominantBaseline="middle"
            >
              {room.label.toUpperCase()}
            </text>
            {hasRender ? (
              <circle
                cx={x + w / 2}
                cy={y + h / 2 + 11}
                r="2.4"
                className={styles.renderDot}
              />
            ) : null}
          </g>
        );
      })}

      {/* Muros — trazo grueso sobre los bordes de cada rectángulo */}
      {plan.rooms
        .filter((r) => r.kind !== "balcon")
        .map((room) => (
          <rect
            key={`w-${room.id}`}
            x={px(room.x)}
            y={py(room.y)}
            width={room.w * scaleX}
            height={room.h * scaleY}
            className={styles.wall}
          />
        ))}

      {/* Envolvente exterior */}
      <rect
        x={PAD}
        y={PAD}
        width={scaleX}
        height={scaleY}
        className={styles.envelope}
      />

      {/* Aberturas */}
      {plan.openings.map((o, i) => {
        const cx = px(o.x);
        const cy = py(o.y);
        const len = o.axis === "h" ? o.size * scaleX : o.size * scaleY;
        return o.kind === "ventana" ? (
          <line
            key={i}
            x1={o.axis === "h" ? cx - len / 2 : cx}
            y1={o.axis === "h" ? cy : cy - len / 2}
            x2={o.axis === "h" ? cx + len / 2 : cx}
            y2={o.axis === "h" ? cy : cy + len / 2}
            className={styles.window}
          />
        ) : (
          <g key={i} transform={`translate(${cx} ${cy})`} className={styles.door}>
            <path
              d={
                o.axis === "h"
                  ? `M ${-len / 2} 0 a ${len} ${len} 0 0 1 ${len} 0`
                  : `M 0 ${-len / 2} a ${len} ${len} 0 0 1 0 ${len}`
              }
              fill="none"
            />
          </g>
        );
      })}

      {/* Norte */}
      <g className={styles.north} transform={`translate(${VB_W - 22} ${PAD + 14})`}>
        <line x1="0" y1="9" x2="0" y2="-8" />
        <path d="M -3.5,-3 L 0,-9 L 3.5,-3" fill="none" />
        <text x="0" y="19">N</text>
      </g>

      {/* Cota de superficie */}
      <g className={styles.dim}>
        <line
          x1={PAD}
          y1={VB_H - 22}
          x2={PAD + scaleX * totalW}
          y2={VB_H - 22}
        />
        <text x={PAD + (scaleX * totalW) / 2} y={VB_H - 9}>
          {unit.surfaceM2} m² · {unit.typology} · {unit.orientation ?? "—"}
        </text>
      </g>
    </svg>
  );
}
