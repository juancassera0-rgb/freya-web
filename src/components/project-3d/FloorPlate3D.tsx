"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { PlanRoom, UnitPlan } from "@/data/planGeometry";
import styles from "./FloorPlate3D.module.css";

type Props = {
  plan: UnitPlan;
  /** 0 = plano técnico plano · 1 = volumen completo. Interpolado por el slider. */
  morph: number;
  activeRoomId: string | null;
  onHoverRoom: (id: string | null) => void;
  onSelectRoom: (room: PlanRoom) => void;
  lite?: boolean;
};

/** Escala en unidades de escena para la envolvente de la unidad */
const PLATE_W = 3.2;
const WALL_H = 0.52;
const WALL_T = 0.045;

const ROOM_COLORS: Record<string, string> = {
  living: "#d8d2c2",
  cocina: "#cfc9b8",
  dormitorio: "#ded8c9",
  bano: "#c6c0b0",
  balcon: "#c4b79a",
  circulacion: "#d4d0c6",
};

/**
 * Planta volumétrica generada desde la MISMA geometría que el plano 2D.
 *
 * `morph` controla la altura de los muros: en 0 la planta se lee como
 * dibujo técnico apoyado en el piso; en 1 los muros están extruidos y el
 * espacio se lee como volumen. La transición es continua porque los
 * rectángulos de origen son idénticos.
 */
export function FloorPlate3D({
  plan,
  morph,
  activeRoomId,
  onHoverRoom,
  onSelectRoom,
  lite = false,
}: Props) {
  const group = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const plateH = PLATE_W / plan.aspect;

  /**
   * Altura de muro interpolada dentro del canvas. El slider actualiza el
   * objetivo; la escala se aplica por ref en useFrame, así arrastrar no
   * dispara reconciliación de React por frame.
   */
  const wallRefs = useRef<THREE.Mesh[]>([]);
  const morphNow = useRef(morph);

  // Convierte rect normalizado → coordenadas de escena centradas
  const toScene = useMemo(
    () => (r: { x: number; y: number; w: number; h: number }) => ({
      cx: (r.x + r.w / 2 - 0.5) * PLATE_W,
      cz: (r.y + r.h / 2 - 0.5) * plateH,
      w: r.w * PLATE_W,
      d: r.h * plateH,
    }),
    [plateH],
  );

  useFrame((_, delta) => {
    const k = 1 - Math.exp(-6 * Math.min(delta, 0.1));
    morphNow.current += (morph - morphNow.current) * k;

    // Escala vertical de los muros desde su base
    const h = Math.max(0.001, morphNow.current);
    for (const wall of wallRefs.current) {
      if (!wall) continue;
      wall.scale.y = h;
      wall.position.y = (h * WALL_H) / 2;
    }

    if (group.current) {
      group.current.rotation.y +=
        (-0.12 - group.current.rotation.y) * (1 - Math.exp(-2.5 * delta));
    }
  });

  /** Altura nominal: los muros se crean a altura plena y se escalan por ref. */
  const wallHeight = WALL_H;
  let wallIndex = 0;

  return (
    <group ref={group} position={[0, 0, 0]}>
      {/* Losa base */}
      <mesh
        position={[0, -0.03, 0]}
        receiveShadow
        onPointerMissed={() => {
          setHovered(null);
          onHoverRoom(null);
        }}
      >
        <boxGeometry args={[PLATE_W + 0.18, 0.06, plateH + 0.18]} />
        <meshStandardMaterial color="#e8e4dc" roughness={0.85} />
      </mesh>

      {plan.rooms.map((room) => {
        const { cx, cz, w, d } = toScene(room);
        const isActive = activeRoomId === room.id;
        const isHovered = hovered === room.id;
        const emphasised = isActive || isHovered;
        const isBalcony = room.kind === "balcon";
        const hasRender = Boolean(room.renderSrc);

        return (
          <group key={room.id} position={[cx, 0, cz]}>
            {/* Solado del ambiente — zona clicable */}
            <mesh
              position={[0, 0.005, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              receiveShadow
              onPointerOver={(e) => {
                e.stopPropagation();
                setHovered(room.id);
                onHoverRoom(room.id);
              }}
              onPointerOut={() => {
                setHovered(null);
                onHoverRoom(null);
              }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectRoom(room);
              }}
            >
              <planeGeometry args={[w * 0.97, d * 0.97]} />
              <meshStandardMaterial
                color={
                  emphasised ? "#4f4c37" : ROOM_COLORS[room.kind] ?? "#d4d0c6"
                }
                roughness={0.9}
                transparent
                opacity={emphasised ? 0.92 : 0.75}
              />
            </mesh>

            {/* Muros perimetrales extruidos — se elevan con el morph */}
            {!isBalcony && (
              <>
                <mesh
                  ref={(n) => {
                    if (n) wallRefs.current[wallIndex++] = n;
                  }}
                  position={[0, wallHeight / 2, -d / 2]}
                  castShadow
                >
                  <boxGeometry args={[w, wallHeight, WALL_T]} />
                  <meshStandardMaterial
                    color={emphasised ? "#6b6749" : "#f0ece2"}
                    roughness={0.8}
                  />
                </mesh>
                <mesh
                  ref={(n) => {
                    if (n) wallRefs.current[wallIndex++] = n;
                  }}
                  position={[-w / 2, wallHeight / 2, 0]}
                  castShadow
                >
                  <boxGeometry args={[WALL_T, wallHeight, d]} />
                  <meshStandardMaterial
                    color={emphasised ? "#6b6749" : "#f0ece2"}
                    roughness={0.8}
                  />
                </mesh>
              </>
            )}

            {/* Baranda del balcón */}
            {isBalcony && (
              <mesh
                ref={(n) => {
                  if (n) wallRefs.current[wallIndex++] = n;
                }}
                position={[w / 2, wallHeight / 2, 0]}
                castShadow
              >
                <boxGeometry args={[WALL_T * 0.6, wallHeight, d]} />
                <meshStandardMaterial
                  color="#4f4c37"
                  roughness={0.45}
                  metalness={0.25}
                  transparent
                  opacity={0.55}
                />
              </mesh>
            )}

            {/* Etiqueta del ambiente — sólo desktop y con morph avanzado */}
            {!lite && morph > 0.25 && (
              <Html
                position={[0, wallHeight + 0.12, 0]}
                center
                distanceFactor={9}
                zIndexRange={[15, 0]}
                style={{ pointerEvents: "none" }}
              >
                <span
                  className={styles.tag}
                  data-active={emphasised ? "true" : "false"}
                  data-render={hasRender ? "true" : "false"}
                >
                  {room.label}
                  {hasRender ? <em className={styles.tagDot} /> : null}
                </span>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}
