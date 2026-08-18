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
     BACK_Z   contrafrente (con paños de vidrio)
     LEFT/RIGHT medianeras del lote, unidas a losas y contrafrente

   Sin esto el edificio es un sandwich abierto: se ve el cielo entre
   pisos y aparece una placa suelta al costado. Eso no es un edificio.
   -------------------------------------------------------------------------- */
const CORE_D = FRONT_Z - BACK_Z;
const CORE_Z = (FRONT_Z + BACK_Z) / 2;
const FIT = 0.016;
const INNER_W = W - WALL * 2 - FIT * 2;
const PLATE_D = CORE_D - WALL - FIT * 2;
const PLATE_Z = (BACK_Z + WALL + FIT + FRONT_Z - FIT) / 2;
/** Medianeras se detienen en este plano; el balcón vuela un poco más en Z. */
const SIDE_FRONT = FRONT_Z + CANTILEVER;
const SIDE_D = SIDE_FRONT - (BACK_Z + WALL);
const SIDE_Z = (BACK_Z + WALL + SIDE_FRONT) / 2;
/** Losa a tope con la cara interior de las medianeras — sin hueco ni overflow. */
const BALC_W = W - WALL * 2 - 0.008;
/** Solo profundidad: la losa sobresale del frente de las medianeras. */
const BALC_OVERHANG = 0.13;
const BALC_D = CANTILEVER + BALC_OVERHANG;
const BALC_START = FRONT_Z;
const BALC_Z = BALC_START + BALC_D / 2;
const RAIL_Z = BALC_START + BALC_D - 0.014;
const RAIL_H = 0.1;
const SIDE_RAIL_D = BALC_OVERHANG - 0.018;
const SIDE_RAIL_Z = SIDE_FRONT + 0.006 + SIDE_RAIL_D / 2;
const RAIL_SIDE_X = BALC_W / 2 - 0.006;
const PICK_Z = (BACK_Z + WALL + FIT + BALC_START + BALC_D) / 2;
const LOBBY_W = INNER_W * 0.34;
const GARAGE_W = INNER_W * 0.62;
/** Paño ciego izquierdo angosto; el resto es vidrio recedido. */
const SOLID_W = INNER_W * 0.14;
const GLASS_W = INNER_W - SOLID_W;
const BAYS = 4;
/** El paño ciego vuela un poco más que el plano de vidrio. */
const APT_WALL_D = 0.07;

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
  fasciaDark: SITE.fasciaDark,
  wood: SITE.wood,
  soffit: SITE.soffit,
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

      glassBase: glass(COL.glass, 0.38, 0.06),
      glassEmph: glass(COL.glassLit, 0.5, 0.04),
      glassDim: glass(COL.glass, 0.14, 0.06),

      slabBase: concrete(COL.soffit, 0.86, {
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
      }),
      slabEmph: make(COL.accent, 0.7),
      slabDim: make(COL.slabFascia, 0.78, { transparent: true, opacity: 0.3 }),

      railBase: glass(COL.rail, 0.28, 0.04),
      railDim: glass(COL.rail, 0.08, 0.04),

      fasciaDark: make(COL.fasciaDark, 0.42, { metalness: 0.35, envMapIntensity: 0.45 }),
      slat: make(COL.mullion, 0.48, { metalness: 0.55, envMapIntensity: 0.4 }),
      wood: make(COL.wood, 0.82, { envMapIntensity: 0.15 }),
      spot: new THREE.MeshBasicMaterial({ color: "#f3ead4" }),
      address: new THREE.MeshBasicMaterial({
        map: (() => {
          const c = document.createElement("canvas");
          c.width = 256;
          c.height = 96;
          const ctx = c.getContext("2d")!;
          ctx.clearRect(0, 0, 256, 96);
          ctx.fillStyle = "#f4f1ea";
          ctx.font = "700 58px Helvetica, Arial, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("620", 128, 50);
          const tex = new THREE.CanvasTexture(c);
          tex.colorSpace = THREE.SRGBColorSpace;
          return tex;
        })(),
        transparent: true,
        depthWrite: false,
      }),
    };
  }, []);

  // Libera materiales al desmontar — evita fugas entre navegaciones
  useEffect(() => {
    return () => {
      const addr = mat.address.map;
      Object.values(mat).forEach((m) => m.dispose());
      addr?.dispose();
    };
  }, [mat]);

  /* ---------- Geometrías ----------
     Prisma ciego (medianeras + contrafrente + techo) y, por piso, una
     losa INTERIOR que no atraviesa muros + un voladizo SOLO a calle.
     Si la losa es un solo bloque del tamaño del lote, perfora las
     paredes: se lee como bug, no como arquitectura. */
  const geo = useMemo(() => {
    const glassH = FLOOR_H - SLAB_T - 0.012;
    const bayW = GLASS_W / BAYS;
    return {
      floorPlate: new THREE.BoxGeometry(INNER_W, SLAB_T, PLATE_D),
      balcony: new THREE.BoxGeometry(BALC_W, SLAB_T, BALC_D),
      fasciaStrip: new THREE.BoxGeometry(BALC_W, SLAB_T + 0.004, 0.016),
      aptWall: new THREE.BoxGeometry(SOLID_W - 0.012, glassH, APT_WALL_D),
      glassBay: new THREE.BoxGeometry(bayW - 0.016, glassH, 0.01),
      rearGlass: new THREE.BoxGeometry(bayW - 0.02, glassH * 0.78, 0.01),
      mullion: new THREE.BoxGeometry(0.011, glassH, 0.014),
      rear: new THREE.BoxGeometry(W, 1, WALL),
      side: new THREE.BoxGeometry(WALL, 1, SIDE_D),
      interiorRear: new THREE.BoxGeometry(INNER_W - 0.02, 1, 0.018),
      interiorSide: new THREE.BoxGeometry(0.018, 1, SIDE_D - FIT * 2),
      rail: new THREE.BoxGeometry(BALC_W - 0.012, RAIL_H, 0.007),
      kick: new THREE.BoxGeometry(BALC_W - 0.012, 0.01, 0.012),
      sideRail: new THREE.BoxGeometry(0.007, RAIL_H, SIDE_RAIL_D),
      sideKick: new THREE.BoxGeometry(0.012, 0.01, SIDE_RAIL_D),
      pick: new THREE.BoxGeometry(INNER_W, FLOOR_H * 0.95, PLATE_D + BALC_D),
      lobbyGlass: new THREE.BoxGeometry(LOBBY_W - 0.02, GROUND_H * 0.86, 0.01),
      slat: new THREE.BoxGeometry(0.013, GROUND_H * 0.86, 0.02),
      spot: new THREE.CylinderGeometry(0.016, 0.016, 0.006, 10),
      planter: new THREE.BoxGeometry(BALC_W * 0.72, 0.07, 0.14),
      bulkhead: new THREE.BoxGeometry(INNER_W * 0.9, FLOOR_H * 0.72, CORE_D * 0.42),
      ribbon: new THREE.BoxGeometry(INNER_W * 0.55, FLOOR_H * 0.16, 0.012),
      punch: new THREE.BoxGeometry(0.11, 0.11, 0.04),
    };
  }, []);

  useEffect(() => {
    return () => Object.values(geo).forEach((g) => g.dispose());
  }, [geo]);

  const floorY = (level: number, ex: number) =>
    GROUND_H + (level - 1) * FLOOR_H + ex * 0.3 * (level - 1);

  const towerH = towerFloors * FLOOR_H;
  const stackH = GROUND_H + towerH;
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
  const stackY = stackH / 2;
  const lobbyX = -INNER_W / 2 + LOBBY_W / 2;
  const garageX = INNER_W / 2 - GARAGE_W / 2;
  const glassStart = -INNER_W / 2 + SOLID_W;
  const bayW = GLASS_W / BAYS;
  const bayXs = Array.from(
    { length: BAYS },
    (_, i) => glassStart + bayW * (i + 0.5),
  );
  const mullionXs = Array.from(
    { length: BAYS - 1 },
    (_, i) => glassStart + bayW * (i + 1),
  );
  const aptWallX = -INNER_W / 2 + SOLID_W / 2;
  const slatCount = 15;
  const spotXs = [-BALC_W * 0.25, 0, BALC_W * 0.25];

  return (
    <group ref={group}>
      <mesh
        geometry={geo.rear}
        position={[0, envelopeY, BACK_Z + WALL / 2]}
        scale={[1, totalH, 1]}
        castShadow
        receiveShadow
        material={mat.stucco}
      />
      {/* Medianera izquierda: hoja continua hasta el coronamiento */}
      <mesh
        geometry={geo.side}
        position={[-W / 2 + WALL / 2, envelopeY, SIDE_Z]}
        scale={[1, totalH, 1]}
        castShadow
        receiveShadow
        material={mat.stucco}
      />
      {/* Medianera derecha: hasta el último piso tipo; el step va en el ático */}
      <mesh
        geometry={geo.side}
        position={[W / 2 - WALL / 2, stackY, SIDE_Z]}
        scale={[1, stackH, 1]}
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
        position={[W / 2 - WALL - FIT, stackY, SIDE_Z]}
        scale={[1, stackH - SLAB_T * 2, 1]}
        material={mat.interior}
      />
      <mesh
        geometry={geo.floorPlate}
        position={[0, SLAB_T / 2, PLATE_Z]}
        receiveShadow
        material={mat.fascia}
      />

      {/* PB: acceso 620 a la izquierda, rejas de cochera a la derecha */}
      <group>
        <mesh
          position={[-INNER_W * 0.28, GROUND_H * 0.5, FRONT_Z - 0.1]}
          material={mat.wood}
        >
          <planeGeometry args={[LOBBY_W * 0.72, GROUND_H * 0.7]} />
        </mesh>
        <mesh
          position={[garageX, GROUND_H * 0.5, FRONT_Z - 0.12]}
          material={mat.interior}
        >
          <planeGeometry args={[GARAGE_W * 0.9, GROUND_H * 0.7]} />
        </mesh>
        <mesh
          position={[lobbyX, GROUND_H * 0.5, FRONT_Z + 0.002]}
          geometry={geo.lobbyGlass}
          material={mat.glassBase}
        />
        <mesh
          position={[lobbyX, GROUND_H * 0.72, FRONT_Z + 0.01]}
          material={mat.address}
        >
          <planeGeometry args={[0.28, 0.1]} />
        </mesh>
        {Array.from({ length: slatCount }, (_, i) => {
          const x =
            garageX - GARAGE_W / 2 + 0.04 + (i + 0.5) * ((GARAGE_W - 0.08) / slatCount);
          return (
            <mesh
              key={`slat-${i}`}
              geometry={geo.slat}
              position={[x, GROUND_H * 0.5, FRONT_Z + 0.004]}
              material={mat.slat}
              castShadow={!lite}
            />
          );
        })}
      </group>

      {Array.from({ length: towerFloors }, (_, i) => {
        const level = i + 1;
        const setback = level === towerFloors;
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
        const glassH = FLOOR_H - SLAB_T - 0.012;
        const glassY = SLAB_T / 2 + glassH / 2;
        const balcScaleZ = setback ? 0.42 : 1;
        const balcZ = setback
          ? BALC_START + (BALC_D * balcScaleZ) / 2
          : BALC_Z;
        const railZ = setback ? BALC_START + BALC_D * balcScaleZ - 0.014 : RAIL_Z;
        /** Vidrio y paño ciego a ~mitad de la profundidad actual del balcón. */
        const facadeZ = BALC_START + (BALC_D * balcScaleZ) * 0.5;

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
              position={[0, 0, balcZ]}
              scale={[1, 1, balcScaleZ]}
              castShadow={!lite}
              receiveShadow
              material={slabMat}
            />
            <mesh
              geometry={geo.fasciaStrip}
              position={[0, 0, railZ]}
              scale={[1, 1, setback ? 0.8 : 1]}
              material={mat.fasciaDark}
            />

            <mesh
              geometry={geo.aptWall}
              position={[aptWallX, glassY, facadeZ + APT_WALL_D / 2]}
              castShadow={!lite}
              receiveShadow
              material={mat.stucco}
            />

            {bayXs.map((x) => (
              <mesh
                key={`g-${x}`}
                geometry={geo.glassBay}
                position={[x, glassY, facadeZ + 0.003]}
                material={glassMat}
              />
            ))}
            {!lite &&
              mullionXs.map((x) => (
                <mesh
                  key={`m-${x}`}
                  geometry={geo.mullion}
                  position={[x, glassY, facadeZ + 0.01]}
                  material={mat.mullion}
                />
              ))}
            {bayXs.map((x) => (
              <mesh
                key={`rg-${x}`}
                geometry={geo.rearGlass}
                position={[x, glassY, BACK_Z - 0.006]}
                material={glassMat}
              />
            ))}

            <mesh
              geometry={geo.kick}
              position={[0, SLAB_T / 2 + 0.006, railZ]}
              material={mat.fasciaDark}
            />
            <mesh
              geometry={geo.rail}
              position={[0, RAIL_H / 2 + SLAB_T / 2 + 0.01, railZ]}
              material={railMat}
            />
            <mesh
              geometry={geo.kick}
              position={[0, RAIL_H + SLAB_T / 2 + 0.014, railZ]}
              material={mat.railCap}
              scale={[1, 0.55, 0.7]}
            />
            {!setback &&
              [-1, 1].map((side) => (
                <group key={`side-rail-${side}`}>
                  <mesh
                    geometry={geo.sideKick}
                    position={[
                      side * RAIL_SIDE_X,
                      SLAB_T / 2 + 0.006,
                      SIDE_RAIL_Z,
                    ]}
                    material={mat.fasciaDark}
                  />
                  <mesh
                    geometry={geo.sideRail}
                    position={[
                      side * RAIL_SIDE_X,
                      RAIL_H / 2 + SLAB_T / 2 + 0.01,
                      SIDE_RAIL_Z,
                    ]}
                    material={railMat}
                  />
                  <mesh
                    geometry={geo.sideKick}
                    position={[
                      side * RAIL_SIDE_X,
                      RAIL_H + SLAB_T / 2 + 0.014,
                      SIDE_RAIL_Z,
                    ]}
                    material={mat.railCap}
                    scale={[0.7, 0.55, 1]}
                  />
                </group>
              ))}

            {!lite &&
              spotXs.map((x) => (
                <mesh
                  key={`spot-${x}`}
                  geometry={geo.spot}
                  position={[x, -SLAB_T / 2 - 0.004, (facadeZ + railZ) / 2]}
                  material={mat.spot}
                />
              ))}

            {setback && !lite && (
              <mesh
                geometry={geo.planter}
                position={[0, 0.05, railZ - 0.06]}
                material={mat.green}
                castShadow
              />
            )}
          </group>
        );
      })}

      <group ref={crownRef} position={[0, GROUND_H + towerH, 0]}>
        <mesh
          geometry={geo.bulkhead}
          position={[0, FLOOR_H * 0.42, CORE_Z - 0.12]}
          castShadow
          receiveShadow
          material={mat.stucco}
        />
        <mesh
          geometry={geo.ribbon}
          position={[0, FLOOR_H * 0.28, FRONT_Z - 0.18]}
          material={mat.glassBase}
        />
        <mesh
          geometry={geo.punch}
          position={[-INNER_W * 0.32, FLOOR_H * 0.58, FRONT_Z - 0.16]}
          material={mat.interior}
        />
        {/* Escalón de la medianera derecha hacia el fondo */}
        <mesh
          position={[W / 2 - WALL / 2, FLOOR_H * 0.28, SIDE_FRONT - 0.18]}
          castShadow
          receiveShadow
          material={mat.stucco}
        >
          <boxGeometry args={[WALL, FLOOR_H * 0.55, 0.36]} />
        </mesh>
        <mesh
          position={[W / 2 - WALL / 2, FLOOR_H * 0.16, CORE_Z]}
          castShadow
          receiveShadow
          material={mat.stucco}
        >
          <boxGeometry args={[WALL, FLOOR_H * 0.32, CORE_D * 0.45]} />
        </mesh>
      </group>

      <mesh
        ref={parapetRef}
        position={[-INNER_W * 0.18, GROUND_H + towerH + FLOOR_H * 0.78, CORE_Z - 0.22]}
        castShadow
        receiveShadow
        material={mat.stucco}
      >
        <boxGeometry args={[INNER_W * 0.42, 0.16, 0.22]} />
      </mesh>
    </group>
  );
}
