"use client";

import { Instance, Instances } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { SITE } from "./sceneTokens";
import { SITE_DIMS } from "./siteDims";

type Props = {
  detail: "low" | "medium" | "high";
};

const { W } = SITE_DIMS;

type Mass = {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  tone: "near" | "mid" | "far";
};

/**
 * Manzana inmediata — pocas casas bajas, hueco hacia la calle (+Z) para
 * no tapar el encuadre. Ninguna toca Freya: el protagonista queda solo.
 *
 * Escala: Freya ~4.2 de alto. Estos volúmenes son PH / casa baja 2–4 pisos.
 * El hueco a cada lado es mayor que el espesor de una medianera (~W*0.5).
 */
const GAP = W * 0.55;

const NEAR: Mass[] = [
  /* Izquierda, separado de la medianera */
  { x: -W / 2 - GAP - 0.51, z: -0.22, w: 1.02, d: 1.32, h: 1.22, tone: "near" },
  /* Más a la izquierda, más bajo — ritmo de cuadra */
  { x: -3.48, z: 0.08, w: 0.92, d: 1.08, h: 0.74, tone: "mid" },
  /* Derecha, retranqueado respecto de nuestra fachada */
  { x: W / 2 + GAP + 0.52, z: -0.68, w: 0.86, d: 1.12, h: 1.18, tone: "near" },
];

const FAR: Mass[] = [
  /* Fondo de manzana, corrido a la izquierda — no se mete en la silueta */
  { x: -3.55, z: -2.35, w: 1.28, d: 0.78, h: 0.92, tone: "far" },
  /* Más a la derecha, más bajo — cierra la cuadra sin competir */
  { x: 4.05, z: -0.55, w: 1.12, d: 1.18, h: 0.78, tone: "mid" },
];

/**
 * Contexto urbano mínimo. Una geometría, materiales compartidos, Instances.
 * Sin sombras propias: el mapa de sombra queda para Freya.
 */
export function NeighbourContext({ detail }: Props) {
  const low = detail === "low";
  const high = detail === "high";

  const mats = useMemo(() => {
    const lambert = (color: string) =>
      new THREE.MeshLambertMaterial({ color });
    return {
      near: lambert(SITE.neighbourShade),
      mid: lambert(SITE.neighbour),
      far: lambert(SITE.neighbourFar),
      ground: lambert(SITE.sidewalkJoint),
    };
  }, []);

  const box = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);

  useEffect(() => {
    return () => {
      Object.values(mats).forEach((m) => m.dispose());
      box.dispose();
    };
  }, [mats, box]);

  if (low) return null;

  const masses = high ? [...NEAR, ...FAR] : NEAR;
  const byTone = {
    near: masses.filter((m) => m.tone === "near"),
    mid: masses.filter((m) => m.tone === "mid"),
    far: masses.filter((m) => m.tone === "far"),
  } as const;

  return (
    <group>
      {/* Solado de manzana: las casas no flotan sobre el vacío */}
      <mesh
        geometry={box}
        material={mats.ground}
        position={[0, -0.012, -1.1]}
        scale={[11.5, 0.02, 3.0]}
        receiveShadow={false}
        castShadow={false}
      />

      {(Object.keys(byTone) as Array<keyof typeof byTone>).map((tone) => {
        const list = byTone[tone];
        if (list.length === 0) return null;
        return (
          <Instances
            key={tone}
            limit={list.length}
            range={list.length}
            geometry={box}
            material={mats[tone]}
            castShadow={false}
            receiveShadow={false}
          >
            {list.map((m) => (
              <Instance
                key={`${m.x}:${m.z}`}
                position={[m.x, m.h / 2, m.z]}
                scale={[m.w, m.h, m.d]}
              />
            ))}
          </Instances>
        );
      })}

      {high && (
        <Instances
          limit={3}
          range={3}
          geometry={box}
          material={mats.far}
          castShadow={false}
        >
          {NEAR.slice(0, 3).map((m) => (
            <Instance
              key={`r-${m.x}`}
              position={[m.x, m.h + 0.03, m.z]}
              scale={[m.w * 0.92, 0.045, m.d * 0.92]}
            />
          ))}
        </Instances>
      )}
    </group>
  );
}
