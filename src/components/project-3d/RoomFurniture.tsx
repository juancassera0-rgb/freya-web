"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { PlanRoom } from "@/data/planGeometry";
import { SITE } from "./sceneTokens";

type Props = {
  room: PlanRoom;
  /** Dimensiones del ambiente en unidades de escena */
  w: number;
  d: number;
  /** 0→1: acompaña la elevación de muros del morph */
  visible: boolean;
  dim: boolean;
};

/**
 * Mobiliario esquemático por ambiente.
 *
 * No busca detalle: busca que la planta se lea HABITADA. Un living con un
 * sofá y una mesa comunica escala y uso mucho mejor que un rectángulo
 * vacío, y de paso hace creíble la superficie declarada.
 *
 * Todo son cajas y cilindros de muy pocos polígonos, con colores derivados
 * de la paleta de marca. Se ocultan cuando el morph está en modo plano,
 * porque ahí lo que se lee es el dibujo técnico.
 */
export function RoomFurniture({ room, w, d, visible, dim }: Props) {
  const mats = useMemo(() => {
    const m = (color: string, roughness = 0.85) =>
      new THREE.MeshStandardMaterial({
        color,
        roughness,
        transparent: true,
      });
    return {
      soft: m(SITE.slabFascia), // tapizados, colchón
      wood: m(SITE.trunk, 0.7), // maderas
      light: m(SITE.stucco), // ropa de cama, mesada
      accent: m(SITE.glass, 0.4), // detalles
      plant: m(SITE.foliageMid, 0.9), // verde de interior
    };
  }, []);

  if (!visible) return null;

  const op = dim ? 0.25 : 1;
  Object.values(mats).forEach((m) => (m.opacity = op));

  const H = 0.02; // altura base de piso

  switch (room.kind) {
    case "living":
      return (
        <group>
          {/* Sofá en L contra el muro */}
          <mesh position={[-w * 0.2, H + 0.045, -d * 0.22]} castShadow material={mats.soft}>
            <boxGeometry args={[w * 0.42, 0.09, d * 0.2]} />
          </mesh>
          <mesh position={[-w * 0.2, H + 0.1, -d * 0.31]} castShadow material={mats.soft}>
            <boxGeometry args={[w * 0.42, 0.09, 0.03]} />
          </mesh>
          {/* Mesa ratona */}
          <mesh position={[-w * 0.2, H + 0.03, 0]} castShadow material={mats.wood}>
            <boxGeometry args={[w * 0.22, 0.025, d * 0.14]} />
          </mesh>
          {/* Mesa de comedor + cuatro sillas */}
          <mesh position={[w * 0.24, H + 0.055, d * 0.16]} castShadow material={mats.wood}>
            <boxGeometry args={[w * 0.3, 0.028, d * 0.24]} />
          </mesh>
          {[
            [-0.11, 0.09],
            [0.11, 0.09],
            [-0.11, -0.09],
            [0.11, -0.09],
          ].map(([ox, oz], i) => (
            <mesh
              key={i}
              position={[w * 0.24 + ox * w, H + 0.035, d * 0.16 + oz * d]}
              castShadow
              material={mats.soft}
            >
              <boxGeometry args={[0.07, 0.07, 0.07]} />
            </mesh>
          ))}
          {/* Alfombra */}
          <mesh position={[-w * 0.2, H + 0.001, -d * 0.02]} material={mats.light}>
            <boxGeometry args={[w * 0.46, 0.004, d * 0.3]} />
          </mesh>
          {/* Planta de interior */}
          <mesh position={[w * 0.4, H + 0.07, -d * 0.3]} castShadow material={mats.plant}>
            <sphereGeometry args={[0.06, 8, 6]} />
          </mesh>
        </group>
      );

    case "dormitorio":
      return (
        <group>
          {/* Cama */}
          <mesh position={[0, H + 0.038, -d * 0.06]} castShadow material={mats.soft}>
            <boxGeometry args={[w * 0.44, 0.076, d * 0.5]} />
          </mesh>
          {/* Almohadas */}
          <mesh position={[0, H + 0.085, -d * 0.26]} castShadow material={mats.light}>
            <boxGeometry args={[w * 0.4, 0.022, d * 0.09]} />
          </mesh>
          {/* Respaldo */}
          <mesh position={[0, H + 0.09, -d * 0.33]} castShadow material={mats.wood}>
            <boxGeometry args={[w * 0.48, 0.11, 0.02]} />
          </mesh>
          {/* Mesa de luz */}
          <mesh position={[w * 0.3, H + 0.03, -d * 0.28]} castShadow material={mats.wood}>
            <boxGeometry args={[0.07, 0.06, 0.07]} />
          </mesh>
          {/* Placard */}
          <mesh position={[-w * 0.36, H + 0.11, d * 0.22]} castShadow material={mats.light}>
            <boxGeometry args={[w * 0.16, 0.22, d * 0.28]} />
          </mesh>
        </group>
      );

    case "cocina":
      return (
        <group>
          {/* Mesada corrida */}
          <mesh position={[0, H + 0.05, -d * 0.28]} castShadow material={mats.light}>
            <boxGeometry args={[w * 0.72, 0.1, d * 0.16]} />
          </mesh>
          {/* Alacena */}
          <mesh position={[0, H + 0.2, -d * 0.32]} castShadow material={mats.wood}>
            <boxGeometry args={[w * 0.6, 0.09, d * 0.1]} />
          </mesh>
          {/* Isla / desayunador */}
          <mesh position={[0, H + 0.045, d * 0.12]} castShadow material={mats.wood}>
            <boxGeometry args={[w * 0.36, 0.09, d * 0.14]} />
          </mesh>
          {/* Banquetas */}
          {[-0.1, 0.1].map((ox, i) => (
            <mesh
              key={i}
              position={[ox * w, H + 0.03, d * 0.3]}
              castShadow
              material={mats.accent}
            >
              <cylinderGeometry args={[0.028, 0.028, 0.06, 6]} />
            </mesh>
          ))}
        </group>
      );

    case "bano":
      return (
        <group>
          {/* Bañera */}
          <mesh position={[-w * 0.22, H + 0.03, 0]} castShadow material={mats.light}>
            <boxGeometry args={[w * 0.3, 0.06, d * 0.55]} />
          </mesh>
          {/* Vanitory */}
          <mesh position={[w * 0.26, H + 0.04, -d * 0.18]} castShadow material={mats.wood}>
            <boxGeometry args={[w * 0.26, 0.08, d * 0.16]} />
          </mesh>
          {/* Inodoro */}
          <mesh position={[w * 0.26, H + 0.03, d * 0.22]} castShadow material={mats.light}>
            <boxGeometry args={[0.07, 0.06, 0.09]} />
          </mesh>
        </group>
      );

    case "balcon":
      return (
        <group>
          {/* Mesa exterior */}
          <mesh position={[0, H + 0.035, -d * 0.15]} castShadow material={mats.wood}>
            <cylinderGeometry args={[0.07, 0.07, 0.05, 10]} />
          </mesh>
          {/* Sillas */}
          {[-0.12, 0.12].map((oz, i) => (
            <mesh
              key={i}
              position={[0, H + 0.03, -d * 0.15 + oz * d]}
              castShadow
              material={mats.accent}
            >
              <boxGeometry args={[0.06, 0.06, 0.06]} />
            </mesh>
          ))}
          {/* Macetas — el verde que se ve desde afuera */}
          {[-0.3, 0.28].map((oz, i) => (
            <mesh
              key={`p-${i}`}
              position={[0, H + 0.06, oz * d]}
              castShadow
              material={mats.plant}
            >
              <sphereGeometry args={[0.055, 8, 6]} />
            </mesh>
          ))}
        </group>
      );

    default:
      return null;
  }
}
