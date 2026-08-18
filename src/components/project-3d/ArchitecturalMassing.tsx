"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import type { Project3DConfig } from "@/data/project3d";
import { BRAND, SITE } from "./sceneTokens";
import {
  getConcreteMap,
  getConcreteNormalMap,
  getConcreteRoughnessMap,
} from "./proceduralTextures";
import { SITE_DIMS } from "./siteDims";

type Props = {
  config: Project3DConfig;
  /** 0 = compacto, 1 = pisos separados (vista explotada) */
  explode?: number;
  explodeRef?: RefObject<number>;
  highlightedFloor?: number | null;
  selectedUnitId?: string | null;
  dimOthers?: boolean;
  /** Reduce geometría y detalle en móvil */
  lite?: boolean;
  hoveredFloor?: number | null;
  onHoverFloor?: (level: number | null) => void;
  onSelectFloor?: (level: number) => void;
  extract?: number;
  /**
   * Balanceo de presencia. Se apaga en táctil: en un teléfono compite con
   * el gesto del usuario y hace que la escena parezca inestable justo
   * cuando se la está tocando.
   */
  idleSway?: boolean;
};

/* --------------------------------------------------------------------------
   PROPORCIONES — derivadas de los renders del proyecto (ver siteDims.ts).
   -------------------------------------------------------------------------- */
const { W, FLOOR_H, GROUND_H, SLAB_T, CANTILEVER, WALL, FRONT_Z, BACK_Z } =
  SITE_DIMS;
/* --------------------------------------------------------------------------
   ENVOLVENTE — un prisma que CIERRA.

     FRONT_Z  vidrio a la calle
     BACK_Z   contrafrente (ciego)
     LEFT/RIGHT medianeras del lote, unidas a losas y contrafrente

   Sin esto el edificio es un sandwich abierto: se ve el cielo entre
   pisos y aparece una placa suelta al costado. Eso no es un edificio.
   -------------------------------------------------------------------------- */
const CORE_D = FRONT_Z - BACK_Z;
const CORE_Z = (FRONT_Z + BACK_Z) / 2;
/** Holgura losa/muro: caras coplanares se pelean en el z-buffer y
    la losa “perfora” el borde visto desde afuera. */
const FIT = 0.02;
const INNER_W = W - WALL * 2 - FIT * 2;
const PLATE_D = CORE_D - WALL - FIT * 2;
const PLATE_Z = (BACK_Z + WALL + FIT + FRONT_Z - FIT) / 2;
/** Medianera: arranca después del contrafrente, no se superpone en la esquina. */
const SIDE_D = CORE_D - WALL;
const SIDE_Z = (BACK_Z + WALL + FRONT_Z) / 2;
/** Voladizo: un pelo adelante del plano de fachada, nunca a ras del muro. */
const BALC_W = W - FIT * 2;
const BALC_START = FRONT_Z + 0.012;
const BALC_Z = BALC_START + CANTILEVER / 2;
const RAIL_Z = BALC_START + CANTILEVER - 0.018;
const RAIL_H = 0.11;
const PICK_Z = (BACK_Z + WALL + FIT + BALC_START + CANTILEVER) / 2;

const COL = {
  stucco: SITE.stucco,
  slabFascia: SITE.slabFascia,
  glass: SITE.glass,
  glassLit: SITE.glassLit,
  mullion: SITE.mullion,
  rail: SITE.rail,
  railCap: SITE.railCap,
  ground: SITE.groundFloor,
  green: SITE.foliage,
  accent: BRAND.camo,
  interior: SITE.interior,
  interiorLit: SITE.interiorLit,
};

export function ArchitecturalMassing({
  config,
  explode = 0,
  explodeRef,
  highlightedFloor = null,
  selectedUnitId = null,
  dimOthers = false,
  lite = false,
  hoveredFloor = null,
  onHoverFloor,
  onSelectFloor,
  extract = 0,
  idleSway = false,
}: Props) {
  const group = useRef<THREE.Group>(null);
  const slabRefs = useRef<Map<number, THREE.Group>>(new Map());
  const crownRef = useRef<THREE.Group>(null);
  const parapetRef = useRef<THREE.Mesh>(null);
  const extractNow = useRef(0);
  const explodeNow = useRef(explode);

  const floors = config.schematicFloors;
  const towerFloors = Math.max(1, floors - 1);

  const selectedUnit = selectedUnitId
    ? config.units.find((u) => u.id === selectedUnitId)
    : null;

  /* ------------------------------------------------------------------
     MATERIALES COMPARTIDOS — incluidas las VARIANTES DE ESTADO.

     Éste era el problema de rendimiento más caro del explorador y no se
     veía a simple vista.

     La versión anterior declaraba `<meshStandardMaterial>` inline dentro
     del map de pisos: vidriado, losa, retorno de losa y dos barandas por
     nivel. Con nueve niveles eso son ~45 materiales distintos, y como
     estaban en el JSX se REASIGNABAN EN CADA RE-RENDER de React. El
     hover sobre un piso es un setState, o sea que pasar el mouse por la
     torre reconstruía 45 materiales por movimiento, cada uno con su
     propio juego de uniforms y sin posibilidad de agrupar draw calls.
     Ése era el tirón al recorrer los pisos con el mouse.

     Ahora hay tres variantes por rol —base, destacada y atenuada— creadas
     una sola vez. El hover pasa a ser elegir una referencia ya existente:
     cero asignaciones, y Three puede reutilizar el programa entre pisos.
     ------------------------------------------------------------------ */
  const mat = useMemo(() => {
    const make = (
      color: string,
      roughness: number,
      opts: Partial<THREE.MeshStandardMaterialParameters> = {},
    ) => new THREE.MeshStandardMaterial({ color, roughness, ...opts });

    /* Hormigón visto — variación de paño procedural + envMap contenido.
       Tres correcciones sobre la versión anterior, todas apuntando al
       mismo síntoma ("se ve de plástico"):
       1. `map` module el tono base ~±20% en paneles anchos — el color es
          lo que el ojo lee primero, mucho antes que el brillo, así que es
          la pieza que realmente rompe la uniformidad en una captura.
       2. `roughnessMap` (mismo patrón, sin espacio de color) evita que la
          superficie responda de forma pareja a la luz especular.
       3. envMapIntensity por default es 1: un mate real no refleja el
          entorno a intensidad plena. Bajarlo a 0.35 saca el lustre que no
          le corresponde a una superficie rugosa. */
    const concreteMap = getConcreteMap();
    const concreteRoughnessMap = getConcreteRoughnessMap();
    const concreteNormalMap = getConcreteNormalMap();
    const concrete = (
      color: string,
      roughness: number,
      extra: Partial<THREE.MeshStandardMaterialParameters> = {},
    ) =>
      make(color, roughness, {
        map: concreteMap,
        roughnessMap: concreteRoughnessMap,
        normalMap: concreteNormalMap,
        normalScale: new THREE.Vector2(1.05, 1.05),
        envMapIntensity: 0.22,
        ...extra,
      });

    const glass = (
      color: string,
      opacity: number,
      metalness: number,
    ) =>
      new THREE.MeshPhysicalMaterial({
        color,
        roughness: 0.035,
        metalness,
        envMapIntensity: 2.6,
        transparent: true,
        opacity,
        clearcoat: 1,
        clearcoatRoughness: 0.04,
        ior: 1.5,
        specularIntensity: 1,
        thickness: 0.22,
        attenuationColor: COL.glass,
        attenuationDistance: 0.6,
      });

    return {
      stucco: concrete(COL.stucco, 0.88),
      fascia: concrete(COL.slabFascia, 0.72, {
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
      }),
      mullion: make(COL.mullion, 0.28, {
        metalness: 0.82,
        envMapIntensity: 0.9,
      }),
      railCap: make(COL.railCap, 0.32, {
        metalness: 0.78,
        envMapIntensity: 0.7,
      }),
      ground: concrete(COL.ground, 0.86),
      green: make(COL.green, 1),

      interior: make(COL.interior, 0.97, { envMapIntensity: 0.05 }),
      interiorLit: make(COL.interiorLit, 0.92, { envMapIntensity: 0.12 }),

      glassBase: glass(COL.glass, 0.52, 0.08),
      glassEmph: glass(COL.glassLit, 0.62, 0.05),
      glassDim: glass(COL.glass, 0.18, 0.08),

      slabBase: concrete(COL.slabFascia, 0.72, {
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
      }),
      slabEmph: make(COL.accent, 0.7),
      slabDim: make(COL.slabFascia, 0.78, { transparent: true, opacity: 0.3 }),

      railBase: glass(COL.rail, 0.38, 0.08),
      railDim: glass(COL.rail, 0.1, 0.08),
    };
  }, []);

  // Libera materiales al desmontar — evita fugas entre navegaciones
  useEffect(() => {
    return () => Object.values(mat).forEach((m) => m.dispose());
  }, [mat]);

  /* ---------- Geometrías ----------
     Prisma ciego (medianeras + contrafrente + techo) y, por piso, una
     losa INTERIOR que no atraviesa muros + un voladizo SOLO a calle.
     Si la losa es un solo bloque del tamaño del lote, perfora las
     paredes: se lee como bug, no como arquitectura. */
  const geo = useMemo(() => {
    const glassH = FLOOR_H - SLAB_T - 0.016;
    const bayW = (INNER_W - 0.06) / 3;
    return {
      floorPlate: new THREE.BoxGeometry(INNER_W, SLAB_T, PLATE_D),
      balcony: new THREE.BoxGeometry(BALC_W, SLAB_T, CANTILEVER),
      column: new THREE.BoxGeometry(0.048, glassH, 0.048),
      glassBay: new THREE.BoxGeometry(bayW - 0.012, glassH, 0.011),
      mullion: new THREE.BoxGeometry(0.014, glassH, 0.018),
      rear: new THREE.BoxGeometry(W, 1, WALL),
      side: new THREE.BoxGeometry(WALL, 1, SIDE_D),
      interiorRear: new THREE.BoxGeometry(INNER_W - 0.02, 1, 0.018),
      interiorSide: new THREE.BoxGeometry(0.018, 1, SIDE_D - FIT * 2),
      rail: new THREE.BoxGeometry(BALC_W - 0.08, RAIL_H, 0.008),
      railSide: new THREE.BoxGeometry(0.008, RAIL_H, CANTILEVER - 0.02),
      railPost: new THREE.BoxGeometry(0.011, RAIL_H, 0.011),
      railCap: new THREE.BoxGeometry(BALC_W - 0.06, 0.007, 0.013),
      railCapSide: new THREE.BoxGeometry(0.013, 0.007, CANTILEVER - 0.01),
      pick: new THREE.BoxGeometry(INNER_W, FLOOR_H * 0.95, PLATE_D + CANTILEVER),
      lobbyGlass: new THREE.BoxGeometry(INNER_W - 0.08, GROUND_H * 0.84, 0.012),
    };
  }, []);

  useEffect(() => {
    return () => Object.values(geo).forEach((g) => g.dispose());
  }, [geo]);

  const floorY = (level: number, ex: number) =>
    GROUND_H + (level - 0.5) * FLOOR_H + ex * 0.3 * (level - 1);

  const towerH = towerFloors * FLOOR_H;
  const totalH = GROUND_H + floors * FLOOR_H;

  /* ---------- Animación interna: sin setState por frame ---------- */
  useFrame((state, delta) => {
    const d = Math.min(delta, 0.1);
    const k = 1 - Math.exp(-3.2 * d);

    extractNow.current += (extract - extractNow.current) * k;

    const explodeTarget = explodeRef?.current ?? explode;
    explodeNow.current += (explodeTarget - explodeNow.current) * k;
    const ex = explodeNow.current;

    const active = highlightedFloor;
    slabRefs.current.forEach((node, level) => {
      const e = active === level ? extractNow.current : 0;
      node.position.z = e * 1.05;
      node.position.y = floorY(level, ex) + e * 0.2;
    });

    if (crownRef.current) {
      crownRef.current.position.y = GROUND_H + towerH + ex * 0.3 * towerFloors;
    }
    if (parapetRef.current) {
      parapetRef.current.position.y =
        GROUND_H + towerH + FLOOR_H + 0.16 + ex * 0.3 * towerFloors;
    }

    if (group.current) {
      const target =
        idleSway && active == null
          ? Math.sin(state.clock.elapsedTime * 0.055) * 0.014
          : 0;
      group.current.rotation.y +=
        (target - group.current.rotation.y) * (1 - Math.exp(-1.8 * d));
    }
  });

  const envelopeY = totalH / 2;

  return (
    <group ref={group}>
      {/* Prisma cerrado: contrafrente + medianeras + piso + techo.
          Mismo material que el resto del edificio — si la medianera es
          otro gris, se lee como una placa suelta (el error del render). */}
      <mesh
        geometry={geo.rear}
        position={[0, envelopeY, BACK_Z + WALL / 2]}
        scale={[1, totalH, 1]}
        castShadow
        receiveShadow
        material={mat.stucco}
      />
      <mesh
        geometry={geo.side}
        position={[-W / 2 + WALL / 2, envelopeY, SIDE_Z]}
        scale={[1, totalH, 1]}
        castShadow
        receiveShadow
        material={mat.stucco}
      />
      <mesh
        geometry={geo.side}
        position={[W / 2 - WALL / 2, envelopeY, SIDE_Z]}
        scale={[1, totalH, 1]}
        castShadow
        receiveShadow
        material={mat.stucco}
      />
      <mesh
        geometry={geo.interiorRear}
        position={[0, envelopeY, BACK_Z + WALL + 0.012]}
        scale={[1, totalH - SLAB_T * 2, 1]}
        material={mat.interior}
      />
      <mesh
        geometry={geo.interiorSide}
        position={[-W / 2 + WALL + FIT, envelopeY, SIDE_Z]}
        scale={[1, totalH - SLAB_T * 2, 1]}
        material={mat.interior}
      />
      <mesh
        geometry={geo.interiorSide}
        position={[W / 2 - WALL - FIT, envelopeY, SIDE_Z]}
        scale={[1, totalH - SLAB_T * 2, 1]}
        material={mat.interior}
      />
      <mesh
        geometry={geo.floorPlate}
        position={[0, SLAB_T / 2, PLATE_Z]}
        receiveShadow
        material={mat.fascia}
      />
      <mesh
        geometry={geo.floorPlate}
        position={[0, totalH - SLAB_T / 2 - 0.01, PLATE_Z]}
        receiveShadow
        material={mat.fascia}
      />

      {/* PB: el mismo prisma, frente de vidrio retranqueado */}
      <group>
        {[-0.28, 0.28].map((f) => (
          <mesh
            key={`gc-${f}`}
            position={[f * W, GROUND_H / 2, FRONT_Z]}
            castShadow
            material={mat.ground}
          >
            <boxGeometry args={[0.055, GROUND_H, 0.055]} />
          </mesh>
        ))}
        <mesh
          position={[0, GROUND_H * 0.5, FRONT_Z - 0.08]}
          material={mat.interiorLit}
        >
          <planeGeometry args={[W - WALL * 2 - 0.12, GROUND_H * 0.72]} />
        </mesh>
        <mesh
          position={[0, GROUND_H * 0.5, FRONT_Z]}
          geometry={geo.lobbyGlass}
          material={mat.glassBase}
        />
        <mesh
          position={[0, GROUND_H, PLATE_Z]}
          castShadow
          receiveShadow
          geometry={geo.floorPlate}
          material={mat.fascia}
        />
        <mesh
          position={[0, GROUND_H, BALC_Z]}
          castShadow
          receiveShadow
          geometry={geo.balcony}
          material={mat.fascia}
        />
      </group>

      {Array.from({ length: towerFloors }, (_, i) => {
        const level = i + 1;
        const active = highlightedFloor === level;
        const isSelectedFloor = selectedUnit?.floor === level;
        const isHovered = hoveredFloor === level;
        const emphasised = active || isSelectedFloor || isHovered;
        const dimmed = dimOthers && !emphasised;
        const glassMat = dimmed
          ? mat.glassDim
          : emphasised
            ? mat.glassEmph
            : mat.glassBase;
        const slabMat = dimmed
          ? mat.slabDim
          : emphasised
            ? mat.slabEmph
            : mat.slabBase;
        const railMat = dimmed ? mat.railDim : mat.railBase;
        const glassH = FLOOR_H - SLAB_T - 0.016;
        const glassY = SLAB_T / 2 + glassH / 2;
        const inner = W / 2 - WALL - 0.02;
        const cols = [-inner, -inner / 3, inner / 3, inner];
        const bays = [-inner * 0.66, 0, inner * 0.66];

        return (
          <group
            key={level}
            ref={(node) => {
              if (node) slabRefs.current.set(level, node);
              else slabRefs.current.delete(level);
            }}
            position={[0, floorY(level, explode), 0]}
          >
            {onSelectFloor ? (
              <mesh
                geometry={geo.pick}
                position={[0, FLOOR_H * 0.35, PICK_Z]}
                visible={false}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onHoverFloor?.(level);
                }}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  onHoverFloor?.(level);
                }}
                onPointerOut={() => onHoverFloor?.(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectFloor(level);
                }}
              />
            ) : null}

            <mesh
              geometry={geo.floorPlate}
              position={[0, 0, PLATE_Z]}
              receiveShadow
              material={slabMat}
            />
            <mesh
              geometry={geo.balcony}
              position={[0, 0, BALC_Z]}
              castShadow={!lite}
              receiveShadow
              material={slabMat}
            />

            {cols.map((x) => (
              <mesh
                key={`c-${x}`}
                geometry={geo.column}
                position={[x, glassY, FRONT_Z - 0.01]}
                castShadow={!lite}
                material={mat.ground}
              />
            ))}

            {bays.map((x) => (
              <mesh
                key={`g-${x}`}
                geometry={geo.glassBay}
                position={[x, glassY, FRONT_Z - 0.006]}
                material={glassMat}
              />
            ))}
            {!lite &&
              cols.slice(1, 3).map((x) => (
                <mesh
                  key={`m-${x}`}
                  geometry={geo.mullion}
                  position={[x, glassY, FRONT_Z]}
                  material={mat.mullion}
                />
              ))}

            <mesh
              geometry={geo.rail}
              position={[0, RAIL_H / 2 + SLAB_T / 2, RAIL_Z]}
              material={railMat}
            />
            <mesh
              geometry={geo.railCap}
              position={[0, RAIL_H + SLAB_T / 2, RAIL_Z]}
              material={mat.railCap}
            />
            {[-1, 1].map((side) => (
              <group key={`rs-${side}`}>
                <mesh
                  geometry={geo.railSide}
                  position={[
                    side * (BALC_W / 2 - 0.01),
                    RAIL_H / 2 + SLAB_T / 2,
                    BALC_Z,
                  ]}
                  material={railMat}
                />
                <mesh
                  geometry={geo.railCapSide}
                  position={[
                    side * (BALC_W / 2 - 0.01),
                    RAIL_H + SLAB_T / 2,
                    BALC_Z,
                  ]}
                  material={mat.railCap}
                />
              </group>
            ))}
            {!lite &&
              cols.map((x) => (
                <mesh
                  key={`p-${x}`}
                  geometry={geo.railPost}
                  position={[x, RAIL_H / 2 + SLAB_T / 2, RAIL_Z]}
                  material={mat.railCap}
                />
              ))}
          </group>
        );
      })}

      <group ref={crownRef} position={[0, GROUND_H + towerH, 0]}>
        <mesh
          position={[0, FLOOR_H * 0.4, CORE_Z - 0.08]}
          castShadow
          receiveShadow
          material={mat.stucco}
        >
          <boxGeometry args={[W - WALL * 2 - 0.08, FLOOR_H * 0.78, CORE_D * 0.55]} />
        </mesh>
        <mesh
          position={[0, FLOOR_H * 0.38, FRONT_Z - 0.12]}
          material={mat.glassBase}
        >
          <boxGeometry args={[W * 0.48, FLOOR_H * 0.55, 0.012]} />
        </mesh>
        <mesh
          position={[0, SLAB_T / 2, PLATE_Z]}
          receiveShadow
          geometry={geo.floorPlate}
          material={mat.fascia}
        />
        <mesh
          position={[0, SLAB_T / 2, BALC_Z]}
          castShadow
          receiveShadow
          geometry={geo.balcony}
          material={mat.fascia}
        />
        {!lite &&
          [-0.2, 0.16].map((f) => (
            <mesh
              key={f}
              position={[f * W, 0.055, RAIL_Z - 0.08]}
              castShadow
              material={mat.green}
            >
              <boxGeometry args={[W * 0.2, 0.08, 0.12]} />
            </mesh>
          ))}
      </group>

      <mesh
        ref={parapetRef}
        position={[-W * 0.1, GROUND_H + towerH + FLOOR_H + 0.1, BACK_Z + 0.28]}
        castShadow
        receiveShadow
        material={mat.stucco}
      >
        <boxGeometry args={[W * 0.36, 0.2, 0.28]} />
      </mesh>
    </group>
  );
}
