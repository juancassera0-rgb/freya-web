"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { SITE } from "./sceneTokens";
import { SITE_DIMS, towerTotalH } from "./siteDims";

type Props = {
  detail: "low" | "medium" | "high";
  /** Pisos del proyecto (default 9 = SOW / Beauchef esquemático) */
  floors?: number;
};

const { W, D, CANTILEVER } = SITE_DIMS;

/**
 * MEDIANERAS — contexto inmediato de Beauchef 620, no ciudad procedural.
 *
 * Street View de Beauchef 620 (Caballito): tejido denso, PB + pisos bajos/
 * medios, estuco ciego en los laterales del lote, sin "torres sueltas" a
 * 15–20 unidades. El producto tiene que leerse encajado entre vecinos
 * reales, más bajos, sin fachadas inventadas que peleen con FREYA.
 *
 * Por eso: sólo tres losas ciegas (sin mapa de ventanas):
 *  1. Derecha — contra la medianera ciega del edificio
 *  2. Izquierda — contra el límite del balcón (lote pasante)
 *  3. Fondo — cara de manzana más baja o igual (nunca más alta)
 *
 * Gama baja: nada. Media: laterales. Alta: laterales + fondo.
 */
export function NeighbourContext({ detail, floors = 9 }: Props) {
  const low = detail === "low";
  const high = detail === "high";
  const totalH = towerTotalH(floors);

  const walls = useMemo(() => {
    if (low) return [] as const;

    const gap = 0.05;
    const thick = 0.12;
    const rightFace = W / 2 + 0.06;
    const leftEdge = W / 2 + CANTILEVER;
    const rearFace = -D / 2;

    const laterals = [
      {
        key: "right",
        x: rightFace + gap + thick / 2,
        z: 0.02,
        w: thick,
        h: totalH * 0.58,
        d: D * 0.88,
        color: SITE.neighbour,
      },
      {
        key: "left",
        x: -(leftEdge + gap + thick / 2),
        z: 0.02,
        w: thick,
        h: totalH * 0.72,
        d: D * 0.88,
        color: SITE.neighbourShade,
      },
    ] as const;

    if (!high) return laterals;

    return [
      ...laterals,
      {
        key: "rear",
        x: 0,
        z: rearFace - gap - 0.55,
        w: W * 1.05,
        h: totalH * 0.92,
        d: thick * 1.4,
        color: SITE.neighbourShade,
      },
    ] as const;
  }, [low, high, totalH]);

  const mat = useMemo(
    () =>
      new THREE.MeshLambertMaterial({
        color: SITE.stucco,
      }),
    [],
  );

  const mats = useMemo(
    () =>
      walls.map(
        (w) =>
          new THREE.MeshLambertMaterial({
            color: w.color,
          }),
      ),
    [walls],
  );

  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);

  useEffect(() => {
    return () => {
      mat.dispose();
      mats.forEach((m) => m.dispose());
      geo.dispose();
    };
  }, [mat, mats, geo]);

  if (walls.length === 0) return null;

  return (
    <group>
      {walls.map((w, i) => (
        <mesh
          key={w.key}
          geometry={geo}
          material={mats[i] ?? mat}
          position={[w.x, w.h / 2, w.z]}
          scale={[w.w, w.h, w.d]}
          castShadow={false}
          receiveShadow={false}
        />
      ))}
    </group>
  );
}
