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

/**
 * Árboles de vereda: [x, escala, variación de tono].
 * Se corrieron hacia los lados y al frente para no taparlo: ninguno queda
 * delante de la fachada.
 */
const TREES: [number, number, number][] = [
  [-2.6, 1.05, 0.0],
  [-1.5, 0.88, 0.35],
  [2.0, 1.1, 0.15],
  [3.3, 0.94, 0.5],
  [-4.1, 0.98, 0.25],
];

/**
 * Contexto del emplazamiento: vereda, cordón, calzada, canteros y arbolado.
 *
 * Los volúmenes vecinos se quitaron a pedido: le restaban protagonismo al
 * edificio y ensuciaban la lectura. La escena ahora es el edificio, su
 * vereda y el arbolado del barrio.
 *
 * Todos los colores vienen de sceneTokens, derivados de la paleta de marca.
 * El arbolado usa instancing (una draw call para todas las copas y otra
 * para los troncos), con color por instancia para que no se vean clonados.
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
      grass: m(SITE.grass, 0.92),
      grassLight: m(SITE.grassLight, 0.9),
      trunk: m(SITE.trunk, 0.95),
      /* El material base va en blanco: el color real lo aporta cada
         instancia, lo que permite variar el follaje sin sumar draw calls. */
      foliage: m("#ffffff", 0.85),
    };
  }, []);

  /** Tres tonos de follaje; cada árbol mezcla los tres en sus masas */
  const foliageTones = useMemo(
    () =>
      dusk
        ? [SITE.foliage, SITE.foliageMid, SITE.foliage]
        : [SITE.foliageMid, SITE.foliageLight, SITE.foliage],
    [dusk],
  );

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
            limit={trees.length * 4}
            range={trees.length * 4}
            geometry={canopyGeo}
            material={mats.foliage}
            castShadow={!low}
          >
            {trees.flatMap(([x, s, tone], i) => {
              /* Cuatro masas por copa con tonos distintos: el follaje se
                 lee volumétrico y vivo en vez de una bocha uniforme.
                 El desfase `tone` evita que dos árboles se vean clonados. */
              const base = CURB_H + 0.7 * s;
              const t = (n: number) =>
                foliageTones[Math.floor(tone * 3 + n) % foliageTones.length];
              return [
                <Instance
                  key={`c-${i}-0`}
                  position={[x, base + 0.3 * s, CURB_Z - 0.36]}
                  scale={s}
                  color={t(1)}
                />,
                <Instance
                  key={`c-${i}-1`}
                  position={[
                    x - 0.23 * s,
                    base + 0.13 * s,
                    CURB_Z - 0.36 + 0.17 * s,
                  ]}
                  scale={s * 0.74}
                  color={t(0)}
                />,
                <Instance
                  key={`c-${i}-2`}
                  position={[
                    x + 0.25 * s,
                    base + 0.2 * s,
                    CURB_Z - 0.36 - 0.15 * s,
                  ]}
                  scale={s * 0.68}
                  color={t(2)}
                />,
                // Masa alta iluminada: da el remate y capta el sol
                <Instance
                  key={`c-${i}-3`}
                  position={[
                    x + 0.06 * s,
                    base + 0.5 * s,
                    CURB_Z - 0.36 + 0.04 * s,
                  ]}
                  scale={s * 0.56}
                  color={foliageTones[1]}
                />,
              ];
            })}
          </Instances>
        </>
      )}

    </group>
  );
}
