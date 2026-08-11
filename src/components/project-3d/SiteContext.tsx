"use client";

import { Instance, Instances } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { SITE, type SceneMood } from "./sceneTokens";

type Props = {
  mood: SceneMood;
  /** low = versión reducida: sin árboles ni juntas de vereda */
  detail: "low" | "medium" | "high";
};

/* --------------------------------------------------------------------------
   EMPLAZAMIENTO — geometría del lote urbano.
   Cotas coherentes con ArchitecturalMassing (W 1.62 · D 2.45).
   El frente del edificio mira a +Z; la calle está en esa dirección.
   -------------------------------------------------------------------------- */
const D = 2.45;

const FRONT = D / 2; // línea municipal
const SIDEWALK_D = 1.5; // ancho de vereda
const CURB_Z = FRONT + SIDEWALK_D; // cordón
const CURB_H = 0.055;
const STREET_D = 5.5;

/** Árboles de vereda: posición X y escala, distribución irregular */
const TREES: [number, number][] = [
  [-2.35, 1.0],
  [-0.35, 0.86],
  [1.75, 1.06],
  [3.6, 0.92],
  [-4.2, 0.95],
];

/** Volúmenes vecinos: [x, ancho, alto, profundidad] */
const NEIGHBOURS: [number, number, number, number][] = [
  [-1.72, 1.75, 2.25, 2.3], // vecino izquierdo, más bajo
  [1.78, 1.85, 1.75, 2.15], // vecino derecho, más bajo aún
  [-3.6, 1.9, 2.9, 2.2], // fondo de manzana
  [3.75, 2.0, 2.05, 2.0],
];

/**
 * Contexto del emplazamiento: vereda, cordón, calzada, canteros, arbolado
 * y las construcciones linderas.
 *
 * Los vecinos no son decoración: son la explicación de por qué el edificio
 * tiene medianeras ciegas. Al verlos, la volumetría se entiende.
 *
 * Todos los colores vienen de sceneTokens, derivados de la paleta de marca.
 * El arbolado usa instancing (una draw call para todas las copas y otra
 * para los troncos).
 */
export function SiteContext({ mood, detail }: Props) {
  const low = detail === "low";
  const high = detail === "high";
  const dusk = mood === "dusk";

  const mats = useMemo(() => {
    const m = (color: string, roughness: number, metalness = 0) =>
      new THREE.MeshStandardMaterial({ color, roughness, metalness });
    return {
      sidewalk: m(SITE.sidewalk, 0.95),
      curb: m(SITE.curb, 0.9),
      asphalt: m(SITE.asphalt, 0.98),
      grass: m(SITE.grass, 1),
      grassLight: m(SITE.grassLight, 1),
      trunk: m(SITE.trunk, 0.95),
      foliage: m(dusk ? SITE.foliage : SITE.foliageLight, 1),
      neighbour: m(SITE.neighbour, 0.94),
      neighbourShade: m(SITE.neighbourShade, 0.94),
    };
  }, [dusk]);

  // Copa de árbol: icosaedro achatado — silueta orgánica con muy pocos polígonos
  const canopyGeo = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(0.42, high ? 1 : 0);
    g.scale(1, 0.78, 1);
    return g;
  }, [high]);

  const trunkGeo = useMemo(
    () => new THREE.CylinderGeometry(0.035, 0.05, 0.75, high ? 7 : 5),
    [high],
  );

  const trees = low ? [] : high ? TREES : TREES.slice(0, 3);

  return (
    <group>
      {/* ---------- Calzada ---------- */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.002, CURB_Z + STREET_D / 2]}
        receiveShadow={!low}
        material={mats.asphalt}
      >
        <planeGeometry args={[30, STREET_D]} />
      </mesh>

      {/* ---------- Vereda ---------- */}
      <mesh
        position={[0, CURB_H / 2, FRONT + SIDEWALK_D / 2]}
        receiveShadow={!low}
        material={mats.sidewalk}
      >
        <boxGeometry args={[30, CURB_H, SIDEWALK_D]} />
      </mesh>

      {/* Cordón — canto vivo contra la calzada */}
      <mesh
        position={[0, CURB_H / 2, CURB_Z + 0.035]}
        castShadow={!low}
        receiveShadow={!low}
        material={mats.curb}
      >
        <boxGeometry args={[30, CURB_H * 1.5, 0.07]} />
      </mesh>

      {/* Juntas de baldosa — sólo en calidad alta */}
      {high && (
        <Instances
          limit={22}
          range={22}
          material={mats.sidewalk}
          castShadow={false}
        >
          <boxGeometry args={[0.012, 0.004, SIDEWALK_D]} />
          {Array.from({ length: 22 }, (_, i) => (
            <Instance
              key={i}
              position={[
                -10 + i * 0.95,
                CURB_H + 0.002,
                FRONT + SIDEWALK_D / 2,
              ]}
              color={SITE.sidewalkJoint}
            />
          ))}
        </Instances>
      )}

      {/* ---------- Terreno del fondo del lote ---------- */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.001, -D / 2 - 2]}
        receiveShadow={!low}
        material={mats.grass}
      >
        <planeGeometry args={[30, 6]} />
      </mesh>

      {/* ---------- Canteros de vereda ---------- */}
      {!low &&
        trees.map(([x], i) => (
          <group key={`pit-${i}`}>
            <mesh
              position={[x, CURB_H + 0.006, CURB_Z - 0.36]}
              receiveShadow
              material={mats.grass}
            >
              <boxGeometry args={[0.52, 0.02, 0.52]} />
            </mesh>
            {/* Borde claro del cantero */}
            <mesh
              position={[x, CURB_H + 0.012, CURB_Z - 0.36]}
              material={mats.grassLight}
            >
              <boxGeometry args={[0.56, 0.01, 0.56]} />
            </mesh>
          </group>
        ))}

      {/* ---------- Arbolado (instanciado) ---------- */}
      {trees.length > 0 && (
        <>
          <Instances
            limit={trees.length}
            range={trees.length}
            geometry={trunkGeo}
            material={mats.trunk}
            castShadow={!low}
          >
            {trees.map(([x, s], i) => (
              <Instance
                key={`t-${i}`}
                position={[x, CURB_H + 0.375 * s, CURB_Z - 0.36]}
                scale={[1, s, 1]}
              />
            ))}
          </Instances>

          <Instances
            limit={trees.length * 3}
            range={trees.length * 3}
            geometry={canopyGeo}
            material={mats.foliage}
            castShadow={!low}
          >
            {trees.flatMap(([x, s], i) => {
              // Tres masas por copa: silueta más creíble que una esfera
              const base = CURB_H + 0.7 * s;
              return [
                <Instance
                  key={`c-${i}-0`}
                  position={[x, base + 0.28 * s, CURB_Z - 0.36]}
                  scale={s}
                />,
                <Instance
                  key={`c-${i}-1`}
                  position={[
                    x - 0.22 * s,
                    base + 0.14 * s,
                    CURB_Z - 0.36 + 0.16 * s,
                  ]}
                  scale={s * 0.72}
                />,
                <Instance
                  key={`c-${i}-2`}
                  position={[
                    x + 0.24 * s,
                    base + 0.19 * s,
                    CURB_Z - 0.36 - 0.14 * s,
                  ]}
                  scale={s * 0.66}
                />,
              ];
            })}
          </Instances>
        </>
      )}

      {/* ---------- Construcciones linderas ----------
          Explican visualmente por qué las medianeras del edificio son
          ciegas: hay obra pegada a ambos lados. */}
      {NEIGHBOURS.map(([x, w, h, d], i) => (
        <mesh
          key={`n-${i}`}
          position={[x, h / 2, -0.1]}
          castShadow={!low}
          receiveShadow={!low}
          material={i % 2 === 0 ? mats.neighbour : mats.neighbourShade}
        >
          <boxGeometry args={[w, h, d]} />
        </mesh>
      ))}

      {/* Parapetos de los vecinos — remate creíble, no cajas rasas */}
      {!low &&
        NEIGHBOURS.map(([x, w, h, d], i) => (
          <mesh
            key={`np-${i}`}
            position={[x, h + 0.055, -0.1 + d / 2 - 0.06]}
            castShadow
            material={mats.neighbourShade}
          >
            <boxGeometry args={[w, 0.11, 0.1]} />
          </mesh>
        ))}
    </group>
  );
}
