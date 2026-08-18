"use client";

import { Instance, Instances } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { SITE, type SceneMood } from "./sceneTokens";
import { getAsphaltMap, getAsphaltRoughnessMap } from "./proceduralTextures";

type Props = {
  mood: SceneMood;
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
const PIT_Z = CURB_Z - 0.36; // eje de canteros y árboles

/**
 * Árboles de vereda: [x, escala, semilla de variación].
 * Ninguno queda delante de la fachada: se corrieron a los laterales.
 */
const TREES: [number, number, number][] = [
  [-2.6, 1.05, 0.0],
  [-1.5, 0.88, 0.35],
  [2.0, 1.1, 0.15],
  [3.3, 0.94, 0.5],
  [-4.1, 0.98, 0.25],
  [4.6, 1.02, 0.7],
  [-5.4, 0.9, 0.45],
];

/**
 * ARBOLADO LEJANO — el recurso de profundidad más barato de la escena.
 *
 * Una franja de copas detrás y a los lados del lote, aclaradas y
 * desaturadas para leer como niebla aérea. Cuesta una sola draw call
 * instanciada y resuelve el problema que tenía la escena: el edificio
 * terminaba contra un gradiente vacío, sin nada que diera escala ni
 * distancia. Ahora hay barrio detrás.
 *
 * No proyectan ni reciben sombra, y se generan con una secuencia
 * determinista (no Math.random) para que el encuadre sea reproducible
 * entre recargas y entre servidor y cliente.
 */
function buildTreeLine(count: number) {
  const out: { pos: [number, number, number]; scale: number; far: boolean }[] =
    [];
  // Secuencia de bajo discrepancia: distribución pareja sin azar
  const phi = 0.6180339887;
  for (let i = 0; i < count; i += 1) {
    const t = (i * phi) % 1;
    const far = i % 3 === 0;
    const row = far ? -13.5 : -8.5;
    const x = -16 + t * 32;
    const jitter = ((i * 7919) % 100) / 100;
    const s = (far ? 1.5 : 1.9) + jitter * 0.8;
    out.push({
      pos: [x, s * 0.62, row - jitter * 2.4],
      scale: s,
      far,
    });
  }
  return out;
}

/**
 * Contexto del emplazamiento: vereda, cordón, calzada, canteros, arbolado
 * de vereda y franja de arbolado lejano.
 *
 * Todos los colores vienen de sceneTokens, derivados de la paleta de marca.
 * Toda la vegetación usa instancing con color por instancia: el follaje
 * varía sin sumar draw calls.
 *
 * Cambio respecto de la versión anterior: en gama baja YA NO se quita la
 * vegetación. Un teléfono puede sostener dos draw calls instanciadas sin
 * problema, y una escena sin un solo árbol se ve más pobre de lo que el
 * ahorro justifica. Lo que baja en gama baja es la cantidad y la
 * teselación, no la presencia.
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
      /* Grano + parches de bacheo muy sutiles — antes un gris perfectamente
         uniforme, la superficie más grande y más cercana a cámara de toda
         la escena. */
      asphalt: new THREE.MeshStandardMaterial({
        color: SITE.asphalt,
        roughness: 0.96,
        map: getAsphaltMap(),
        roughnessMap: getAsphaltRoughnessMap(),
      }),
      grass: m(SITE.grass, 0.92),
      grassLight: m(SITE.grassLight, 0.9),
      trunk: m(SITE.trunk, 0.95),
      /* Base blanca: el color real lo aporta cada instancia. */
      foliage: m("#ffffff", 0.85),
      /* El arbolado lejano no recibe luz direccional relevante a esa
         distancia; con Basic se ahorra todo el cálculo de iluminación y se
         ve igual, porque su color ya viene con la niebla aérea incorporada. */
      treeLine: new THREE.MeshBasicMaterial({ color: "#ffffff" }),
    };
  }, []);

  useMemo(
    () => () => Object.values(mats).forEach((m) => m.dispose()),
    [mats],
  );

  /** Cinco tonos de follaje: con tres se veía el patrón */
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

  /* Copa: icosaedro achatado y ENSANCHADO — no una bocha, un paraguas.
     Caballito es tipa/jacarandá de vereda: copa ancha y relativamente
     plana, mucho más parecida a un paraguas achatado que a la esfera
     genérica que había antes (uno de los motivos por los que los árboles
     se leían como "prototipo"). Silueta orgánica, sigue en muy pocos
     polígonos. */
  const canopyGeo = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(0.42, high ? 1 : 0);
    g.scale(1.22, 0.6, 1.22);
    return g;
  }, [high]);

  /* Tronco con base ensanchada — el cono recto de antes se leía como cono
     de tránsito. Más taper (base más ancha, remate más fino) da la
     sensación de raíz/base real sin sumar geometría. */
  const trunkGeo = useMemo(
    () => new THREE.CylinderGeometry(0.026, 0.068, 0.75, high ? 8 : 6),
    [high],
  );

  const farCanopyGeo = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(1, 0);
    g.scale(1.15, 0.58, 1.15);
    return g;
  }, []);

  const trees = low ? TREES.slice(0, 2) : high ? TREES : TREES.slice(0, 4);
  const treeLine = useMemo(
    () => buildTreeLine(low ? 12 : high ? 30 : 20),
    [low, high],
  );

  return (
    <group>
      {/* ---------- Arbolado lejano: profundidad de fondo ---------- */}
      <Instances
        limit={treeLine.length}
        range={treeLine.length}
        geometry={farCanopyGeo}
        material={mats.treeLine}
        castShadow={false}
        receiveShadow={false}
      >
        {treeLine.map((t, i) => (
          <Instance
            key={`fl-${i}`}
            position={t.pos}
            scale={t.scale}
            color={t.far ? SITE.treeLineFar : SITE.treeLineNear}
          />
        ))}
      </Instances>

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
        <Instances limit={22} range={22} material={mats.sidewalk} castShadow={false}>
          <boxGeometry args={[0.012, 0.004, SIDEWALK_D]} />
          {Array.from({ length: 22 }, (_, i) => (
            <Instance
              key={i}
              position={[-10 + i * 0.95, CURB_H + 0.002, FRONT + SIDEWALK_D / 2]}
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
      {trees.map(([x], i) => (
        <group key={`pit-${i}`}>
          <mesh
            position={[x, CURB_H + 0.006, PIT_Z]}
            receiveShadow={!low}
            material={mats.grass}
          >
            <boxGeometry args={[0.52, 0.02, 0.52]} />
          </mesh>
          <mesh
            position={[x, CURB_H + 0.012, PIT_Z]}
            material={mats.grassLight}
          >
            <boxGeometry args={[0.56, 0.01, 0.56]} />
          </mesh>
        </group>
      ))}

      {/* ---------- Arbolado de vereda (instanciado) ---------- */}
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
            position={[x, CURB_H + 0.375 * s, PIT_Z]}
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
          /* Cuatro masas por copa con tonos distintos: el follaje se lee
             volumétrico en vez de una bocha uniforme. La rotación por
             instancia rompe la simetría del icosaedro, que es lo que
             delataba que todos los árboles eran el mismo objeto. */
          const base = CURB_H + 0.7 * s;
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
              position={[x, base + 0.3 * s, PIT_Z]}
              rotation={rot(0)}
              scale={s}
              color={t(1)}
            />,
            <Instance
              key={`c-${i}-1`}
              position={[x - 0.23 * s, base + 0.13 * s, PIT_Z + 0.17 * s]}
              rotation={rot(1)}
              scale={s * 0.74}
              color={t(0)}
            />,
            <Instance
              key={`c-${i}-2`}
              position={[x + 0.25 * s, base + 0.2 * s, PIT_Z - 0.15 * s]}
              rotation={rot(2)}
              scale={s * 0.68}
              color={t(3)}
            />,
            /* Masa alta: el remate que capta el sol. Siempre el tono más
               claro — es lo que hace que el árbol tenga dirección de luz. */
            <Instance
              key={`c-${i}-3`}
              position={[x + 0.06 * s, base + 0.5 * s, PIT_Z + 0.04 * s]}
              rotation={rot(3)}
              scale={s * 0.56}
              color={high ? SITE.foliageSun : SITE.foliageLight}
            />,
          ];
        })}
      </Instances>

      {/* ---------- Seto bajo contra la línea municipal ----------
          Ancla el edificio al suelo y tapa el encuentro seco entre la
          vereda y el basamento. Instanciado: una draw call. */}
      {!low && (
        <Instances limit={14} range={14} material={mats.foliage} castShadow={false}>
          <boxGeometry args={[0.42, 0.16, 0.26]} />
          {Array.from({ length: 14 }, (_, i) => {
            const x = -3.1 + i * 0.46;
            // Se salta el tramo del acceso, al centro de la fachada
            if (Math.abs(x) < 1.0) return null;
            return (
              <Instance
                key={`h-${i}`}
                position={[x, CURB_H + 0.08, FRONT + 0.2]}
                color={foliageTones[i % foliageTones.length]}
              />
            );
          })}
        </Instances>
      )}
    </group>
  );
}
