"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { SITE } from "./sceneTokens";
import { createFacadeWindowMap } from "./proceduralTextures";

type Props = {
  detail: "low" | "medium" | "high";
};

type Neighbour = {
  x: number;
  z: number;
  w: number;
  h: number;
  d: number;
  shade: boolean;
  far: boolean;
};

/**
 * Manzana vecina — posiciones y proporciones a mano, como TREES en
 * SiteContext. Nada delante de la fachada; todo detrás y a los costados,
 * detrás de la primera fila de arbolado para que los troncos tapen el
 * encuentro con el piso.
 */
const NEIGHBOURS: Neighbour[] = [
  { x: -8.5, z: -15.5, w: 1.3, h: 4.6, d: 1.1, shade: false, far: false },
  { x: -5.4, z: -17.6, w: 1.6, h: 3.4, d: 1.2, shade: true, far: false },
  { x: -2.4, z: -19.2, w: 1.1, h: 5.2, d: 1.0, shade: false, far: true },
  { x: 2.9, z: -18.3, w: 1.4, h: 4.1, d: 1.3, shade: true, far: false },
  { x: 6.3, z: -16.7, w: 1.2, h: 3.6, d: 1.0, shade: false, far: false },
  { x: 9.5, z: -19.6, w: 1.5, h: 4.8, d: 1.1, shade: true, far: true },
  { x: -11.6, z: -12.6, w: 1.0, h: 3.0, d: 0.9, shade: false, far: false },
  { x: 11.9, z: -13.1, w: 1.1, h: 3.3, d: 0.95, shade: true, far: false },
];

/**
 * Contexto construido — la manzana detrás del lote.
 *
 * Sin esto, el edificio terminaba contra el arbolado lejano y el cielo:
 * había escala, pero no ciudad. Son volúmenes lisos con una fachada
 * procedural de aberturas (ver proceduralTextures) — no compiten en
 * detalle con el edificio principal, que es donde tiene que quedar la
 * atención; sólo dan profundidad y contexto urbano detrás.
 *
 * Gama baja: se omite por completo (ocho meshes más no se justifican en
 * hardware débil). Gama media: sólo la fila cercana. Gama alta: la manzana
 * completa, con la fila más lejana en un material sin luz (mismo criterio
 * que el arbolado lejano de SiteContext) y aclarada como niebla aérea.
 */
export function NeighbourContext({ detail }: Props) {
  const low = detail === "low";
  const high = detail === "high";

  const list = useMemo(
    () => (low ? [] : high ? NEIGHBOURS : NEIGHBOURS.filter((n) => !n.far)),
    [low, high],
  );

  const mats = useMemo(
    () =>
      list.map((n) => {
        const map = createFacadeWindowMap(
          Math.max(1, Math.round(n.w * 2.4)),
          Math.max(1, Math.round(n.h * 2.4)),
        );
        const color = n.far
          ? SITE.neighbourFar
          : n.shade
            ? SITE.neighbourShade
            : SITE.neighbour;
        // La fila lejana no recibe luz direccional relevante a esa
        // distancia; Basic ahorra el cálculo y se ve igual, porque el color
        // ya trae la niebla aérea incorporada (mismo criterio que treeLine).
        return n.far
          ? new THREE.MeshBasicMaterial({ map, color })
          : new THREE.MeshLambertMaterial({ map, color });
      }),
    [list],
  );

  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);

  if (list.length === 0) return null;

  return (
    <group>
      {list.map((n, i) => (
        <mesh
          key={`${n.x}-${n.z}`}
          geometry={geo}
          position={[n.x, n.h / 2, n.z]}
          scale={[n.w, n.h, n.d]}
          material={mats[i]}
        />
      ))}
    </group>
  );
}
