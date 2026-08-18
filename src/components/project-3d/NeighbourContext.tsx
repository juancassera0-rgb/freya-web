"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { SITE } from "./sceneTokens";
import { createFacadeWindowMap } from "./proceduralTextures";

type Props = {
  detail: "low" | "medium" | "high";
};

/* --------------------------------------------------------------------------
   CONTEXTO REAL — Beauchef 620, Caballito, Buenos Aires.

   La versión anterior armaba una "manzana" genérica: ocho volúmenes
   dispersos a 15-20 unidades del lote, más lejos que cualquier vecino real
   podría estar. Se leía como ciudad procedural de relleno, no como el lugar
   real del proyecto — exactamente lo que el brief pidió corregir.

   Caballito es un barrio denso y consolidado (Fin de Siècle mezclado con
   edificios en altura de distintas épocas, ~29.000 hab/km², sin grandes
   espacios verdes salvo Parque Rivadavia/Centenario): la lectura urbana
   correcta para un lote como Beauchef 620 es la de un desarrollo nuevo
   encajado ENTRE medianeras vecinas más bajas, con la manzana continuando
   detrás — no una plaza rodeada de torres sueltas.

   Por eso ahora hay CUATRO volúmenes, no ocho, y los dos primeros tocan
   literalmente las líneas de medianera del edificio (ver W/D/GROUND_H/
   FLOOR_H, que deben coincidir con ArchitecturalMassing):

   1. Vecino derecho — inmediato, más bajo (más antiguo), contra la
      medianera ciega de la derecha.
   2. Vecino izquierdo — inmediato, apenas más alto que el 1, contra el
      límite del balcón izquierdo. Real Estate de Caballito casi siempre
      tiene medianera a los dos lados de un lote pasante.
   3. Vecino trasero — un poco más alto que FREYA, retranqueado más allá
      de la medianera trasera: la manzana que sigue detrás del lote.
   4. Uno solo "atmosférico" a lo lejos, con el mismo tratamiento sin luz
      que ya usa el arbolado lejano de SiteContext (niebla aérea en el
      color, cero costo de sombreado).

   Todos son volúmenes lisos con la fachada procedural de aberturas — no
   compiten en detalle con FREYA, que tiene que seguir siendo el
   protagonista. Las alturas son SIEMPRE menores o apenas mayores a la
   torre (nunca el doble), para que el edificio del proyecto domine el
   encuadre igual que antes.
   -------------------------------------------------------------------------- */
const W = 1.62;
const D = 2.45;
const GROUND_H = 0.62;
const FLOOR_H = 0.4;
const FLOORS = 9; // coincide con sow3d.schematicFloors — único proyecto con explorador 3D hoy
const TOTAL_H = GROUND_H + FLOORS * FLOOR_H;
const CANTILEVER = 0.3; // coincide con ArchitecturalMassing — vuelo del balcón

/** Líneas reales del volumen — de acá salen las posiciones de los vecinos. */
const MEDIANERA_THICK_HALF = 0.06; // mitad del espesor de las cajas de medianera
const MEDIANERA_FACE_X = W / 2 + 0.06 + MEDIANERA_THICK_HALF; // cara exterior de la medianera derecha
const BALCONY_EDGE_X = W / 2 + CANTILEVER; // punta del balcón, lado izquierdo (ya es una arista, no una caja)
const MEDIANERA_REAR_FACE_Z = -D / 2 - MEDIANERA_THICK_HALF; // cara exterior de la medianera de fondo
const GAP = 0.06; // separación mínima contra z-fighting en las líneas de lote

type Neighbour = {
  x: number;
  z: number;
  w: number;
  h: number;
  d: number;
  shade: boolean;
  far: boolean;
};

const NEIGHBOURS: Neighbour[] = [
  // Vecino derecho — tocando la medianera ciega real del edificio
  {
    x: MEDIANERA_FACE_X + GAP + 1.15 / 2,
    z: 0.03,
    w: 1.15,
    h: TOTAL_H * 0.62,
    d: D * 0.92,
    shade: false,
    far: false,
  },
  // Vecino izquierdo — tocando la punta del balcón (lote pasante: casi
  // todo lote en Caballito tiene medianera a los dos lados)
  {
    x: -(BALCONY_EDGE_X + GAP + 1.05 / 2),
    z: 0.03,
    w: 1.05,
    h: TOTAL_H * 0.78,
    d: D * 0.92,
    shade: true,
    far: false,
  },
  // Vecino trasero — la manzana continuando más allá de la medianera de fondo
  {
    x: 0,
    z: MEDIANERA_REAR_FACE_Z - 0.6 - 1.3 / 2,
    w: 1.7,
    h: TOTAL_H * 1.05,
    d: 1.3,
    shade: true,
    far: false,
  },
  // Uno solo, lejano y atmosférico — profundidad sin competir con el proyecto
  { x: 3.6, z: -0.6, w: 1.4, h: TOTAL_H * 0.55, d: 1.3, shade: false, far: true },
];

/**
 * Contexto construido — la cuadra real de Beauchef 620, simplificada con
 * criterio: los dos vecinos inmediatos tocan las líneas de medianera reales
 * del edificio, el tercero retranqueado da continuidad de manzana, y el
 * cuarto es sólo silueta lejana. Nada de esto reemplaza el modelo oficial
 * (no hay imágenes de Street View ni fotos reales usadas como textura,
 * sólo la comprensión general del tejido urbano de Caballito) — es una
 * interpretación arquitectónica optimizada, no una reconstrucción forense.
 *
 * Gama baja: se omite por completo. Gama media: sólo los dos vecinos
 * inmediatos (la señal mínima de "esto está construido entre medianeras").
 * Gama alta: los cuatro, incluida la silueta lejana.
 */
export function NeighbourContext({ detail }: Props) {
  const low = detail === "low";
  const high = detail === "high";

  const list = useMemo(
    () => (low ? [] : high ? NEIGHBOURS : NEIGHBOURS.slice(0, 2)),
    [low, high],
  );

  const mats = useMemo(
    () =>
      list.map((n) => {
        const map = createFacadeWindowMap(
          Math.max(1, Math.round(n.w * 2.2)),
          Math.max(1, Math.round(n.h * 2.6)),
        );
        const color = n.far
          ? SITE.neighbourFar
          : n.shade
            ? SITE.neighbourShade
            : SITE.neighbour;
        // La silueta lejana no recibe luz direccional relevante a esa
        // distancia; Basic ahorra el cálculo y se ve igual, porque el color
        // ya trae la niebla aérea incorporada (mismo criterio que treeLine
        // en SiteContext).
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
