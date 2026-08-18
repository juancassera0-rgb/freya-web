"use client";

import { Instance, Instances } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { SITE, type SceneMood } from "./sceneTokens";
import { getAsphaltMap, getAsphaltRoughnessMap } from "./proceduralTextures";
import { SITE_DIMS } from "./siteDims";

type Props = {
  mood: SceneMood;
  detail: "low" | "medium" | "high";
};

const { W, CANTILEVER, FRONT_Z, BACK_Z } = SITE_DIMS;

/** Vereda arranca justo después del voladizo — el lote no flota en el vacío. */
const FRONT = FRONT_Z + CANTILEVER + 0.06;
const SIDEWALK_D = 1.45;
const CURB_Z = FRONT + SIDEWALK_D;
const CURB_H = 0.055;
const STREET_D = 4.8;
const PIT_Z = CURB_Z - 0.34;
/** Ancho de calle/vereda visible — cuadra inmediata, no ciudad infinita */
const STREET_SPAN = 14;

/**
 * Tipas / jacarandás de vereda — ritmo lateral tipo Beauchef.
 * Ninguno tapa la fachada; espaciado irregular de arbolado porteño.
 */
const TREES: [number, number, number][] = [
  [-2.55, 1.02, 0.1],
  [-1.55, 0.9, 0.4],
  [2.05, 1.06, 0.2],
  [3.15, 0.92, 0.55],
  [-3.85, 0.96, 0.3],
];

/**
 * Emplazamiento Beauchef 620: vereda, cordón, calzada, canteros, tipas
 * laterales y un fondo de lote estrecho. Sin bosque lejano procedural —
 * la profundidad la dan niebla + medianeras, no 30 copas inventadas.
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
      asphalt: new THREE.MeshStandardMaterial({
        color: SITE.asphalt,
        roughness: 0.96,
        map: getAsphaltMap(),
        roughnessMap: getAsphaltRoughnessMap(),
      }),
      grass: m(SITE.grass, 0.92),
      grassLight: m(SITE.grassLight, 0.9),
      trunk: m(SITE.trunk, 0.95),
      foliage: m("#ffffff", 0.85),
      patio: m(SITE.sidewalkJoint, 0.94),
    };
  }, []);

  useEffect(() => {
    return () => Object.values(mats).forEach((m) => m.dispose());
  }, [mats]);

  const foliageTones = useMemo(
    () =>
      dusk
        ? [SITE.foliageDeep, SITE.foliage, SITE.foliageMid, SITE.foliage, SITE.foliageDeep]
        : [
            SITE.foliage,
            SITE.foliageMid,
            SITE.foliageLight,
            SITE.foliageDeep,
            SITE.foliageSun,
          ],
    [dusk],
  );

  const canopyGeo = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(0.42, high ? 1 : 0);
    g.scale(1.28, 0.55, 1.28);
    return g;
  }, [high]);

  const trunkGeo = useMemo(
    () => new THREE.CylinderGeometry(0.026, 0.07, 0.78, high ? 8 : 6),
    [high],
  );

  useEffect(() => {
    return () => {
      canopyGeo.dispose();
      trunkGeo.dispose();
    };
  }, [canopyGeo, trunkGeo]);

  const trees = low ? TREES.slice(0, 2) : high ? TREES : TREES.slice(0, 4);

  return (
    <group>
      {/* Calzada — sólo el tramo de cuadra frente al lote */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.002, CURB_Z + STREET_D / 2]}
        receiveShadow={!low}
        material={mats.asphalt}
      >
        <planeGeometry args={[STREET_SPAN, STREET_D]} />
      </mesh>

      {/* Vereda */}
      <mesh
        position={[0, CURB_H / 2, FRONT + SIDEWALK_D / 2]}
        receiveShadow={!low}
        material={mats.sidewalk}
      >
        <boxGeometry args={[STREET_SPAN, CURB_H, SIDEWALK_D]} />
      </mesh>

      {/* Cordón */}
      <mesh
        position={[0, CURB_H / 2, CURB_Z + 0.035]}
        castShadow={!low}
        receiveShadow={!low}
        material={mats.curb}
      >
        <boxGeometry args={[STREET_SPAN, CURB_H * 1.5, 0.07]} />
      </mesh>

      {high && (
        <Instances limit={14} range={14} material={mats.sidewalk} castShadow={false}>
          <boxGeometry args={[0.012, 0.004, SIDEWALK_D]} />
          {Array.from({ length: 14 }, (_, i) => (
            <Instance
              key={i}
              position={[-6.2 + i * 0.95, CURB_H + 0.002, FRONT + SIDEWALK_D / 2]}
              color={SITE.sidewalkJoint}
            />
          ))}
        </Instances>
      )}

      {/* Solado del lote — une contrafrente, medianeras y vereda */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.001, (BACK_Z + FRONT) / 2]}
        receiveShadow={!low}
        material={mats.patio}
      >
        <planeGeometry args={[W + 0.22, FRONT - BACK_Z + 0.12]} />
      </mesh>

      {/* Fondo de lote — patio estrecho, no césped suburbano de 30×6 */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.001, BACK_Z - 0.85]}
        receiveShadow={!low}
        material={mats.patio}
      >
        <planeGeometry args={[W * 2.2, 1.5]} />
      </mesh>

      {trees.map(([x], i) => (
        <group key={`pit-${i}`}>
          <mesh
            position={[x, CURB_H + 0.006, PIT_Z]}
            receiveShadow={!low}
            material={mats.grass}
          >
            <boxGeometry args={[0.48, 0.02, 0.48]} />
          </mesh>
          <mesh position={[x, CURB_H + 0.012, PIT_Z]} material={mats.grassLight}>
            <boxGeometry args={[0.52, 0.01, 0.52]} />
          </mesh>
        </group>
      ))}

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
            position={[x, CURB_H + 0.39 * s, PIT_Z]}
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
          const base = CURB_H + 0.72 * s;
          const t = (n: number) =>
            foliageTones[Math.floor(tone * 5 + n) % foliageTones.length];
          const rot = (n: number): [number, number, number] => [
            0,
            (tone * 3.1 + n * 1.27) % (Math.PI * 2),
            0,
          ];
          return [
            <Instance
              key={`c-${i}-0`}
              position={[x, base + 0.28 * s, PIT_Z]}
              rotation={rot(0)}
              scale={s}
              color={t(1)}
            />,
            <Instance
              key={`c-${i}-1`}
              position={[x - 0.22 * s, base + 0.12 * s, PIT_Z + 0.16 * s]}
              rotation={rot(1)}
              scale={s * 0.72}
              color={t(0)}
            />,
            <Instance
              key={`c-${i}-2`}
              position={[x + 0.24 * s, base + 0.18 * s, PIT_Z - 0.14 * s]}
              rotation={rot(2)}
              scale={s * 0.66}
              color={t(3)}
            />,
            <Instance
              key={`c-${i}-3`}
              position={[x + 0.05 * s, base + 0.46 * s, PIT_Z + 0.03 * s]}
              rotation={rot(3)}
              scale={s * 0.54}
              color={high ? SITE.foliageSun : SITE.foliageLight}
            />,
          ];
        })}
      </Instances>

      {/* Seto bajo sólo en el frente del lote */}
      {!low && (
        <Instances limit={10} range={10} material={mats.foliage} castShadow={false}>
          <boxGeometry args={[0.38, 0.14, 0.22]} />
          {Array.from({ length: 10 }, (_, i) => {
            const x = -W * 1.15 + i * 0.42;
            if (Math.abs(x) < 0.85) return null;
            return (
              <Instance
                key={`h-${i}`}
                position={[x, CURB_H + 0.07, FRONT + 0.18]}
                color={foliageTones[i % foliageTones.length]}
              />
            );
          })}
        </Instances>
      )}
    </group>
  );
}
