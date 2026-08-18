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
const OPENING_H = FLOOR_H - SLAB_T - 0.012;
/** Dintel sobre el vidrio; un poco más atrás que el paño izquierdo. */
const BAND_H = OPENING_H * 0.2;
const GLASS_OPEN_H = OPENING_H - BAND_H;
/** El paño ciego vuela un poco más que el plano de vidrio. */
const APT_WALL_D = 0.07;
const BAND_D = 0.048;
/**
 * Pisos 1–8: balcón tipo.
 * Piso 9: penthouse con las paredes del edificio y techo sobre el volumen.
 * La terraza queda al aire: sin muros ni techo adelante.
 */
const PH_BALC_SCALE = 0.75;
const PH_GLASS_Z = FRONT_Z - 0.08;
const PH_LEFT_W = INNER_W * 0.22;
const PH_RIGHT_W = 0.1;
const PH_GLASS_W = INNER_W - PH_LEFT_W - PH_RIGHT_W;
const PH_GLASS_H = OPENING_H * 0.7;
const PH_PARAPET_H = 0.058;
const PH_ROOM_H = FLOOR_H - SLAB_T;
const PH_BACK = BACK_Z + WALL;
const PH_ROOM_D = PH_GLASS_Z - PH_BACK;
const PH_ROOM_Z = (PH_GLASS_Z + PH_BACK) / 2;
const PH_ROOF_T = SLAB_T;

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
  const extractNow = useRef(0);
  const explodeNow = useRef(explode);

  const towerFloors = Math.max(1, config.schematicFloors);

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
      foliageSun: make(SITE.foliageSun, 1),
      foliageMid: make(SITE.foliageMid, 1),

      interior: make(COL.interior, 0.97, { envMapIntensity: 0.05 }),
      interiorLit: make(COL.interiorLit, 0.92, { envMapIntensity: 0.12 }),

      glassBase: glass(COL.glass, 0.38, 0.06),
      glassEmph: glass(COL.glassLit, 0.5, 0.04),
      glassDim: glass(COL.glass, 0.14, 0.06),
      glassPent: new THREE.MeshPhysicalMaterial({
        color: COL.glass,
        roughness: 0.05,
        metalness: 0.48,
        envMapIntensity: 3.4,
        transparent: true,
        opacity: 0.84,
        clearcoat: 1,
        clearcoatRoughness: 0.05,
        ior: 1.52,
        specularIntensity: 1.2,
        thickness: 0.28,
        attenuationColor: COL.glass,
        attenuationDistance: 0.32,
      }),

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
    const bayW = GLASS_W / BAYS;
    return {
      floorPlate: new THREE.BoxGeometry(INNER_W, SLAB_T, PLATE_D),
      balcony: new THREE.BoxGeometry(BALC_W, SLAB_T, BALC_D),
      fasciaStrip: new THREE.BoxGeometry(BALC_W, SLAB_T + 0.004, 0.016),
      aptWall: new THREE.BoxGeometry(SOLID_W - 0.012, OPENING_H, APT_WALL_D),
      upperBand: new THREE.BoxGeometry(GLASS_W - 0.008, BAND_H, BAND_D),
      glassBay: new THREE.BoxGeometry(bayW - 0.016, GLASS_OPEN_H, 0.01),
      rearGlass: new THREE.BoxGeometry(bayW - 0.02, OPENING_H * 0.78, 0.01),
      mullion: new THREE.BoxGeometry(0.011, GLASS_OPEN_H, 0.014),
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
      phGlass: new THREE.BoxGeometry(PH_GLASS_W, PH_GLASS_H, 0.014),
      phGlassVoid: new THREE.BoxGeometry(PH_GLASS_W - 0.02, PH_GLASS_H - 0.01, 0.04),
      phLintel: new THREE.BoxGeometry(PH_GLASS_W + 0.04, 0.07, WALL),
      phParapet: new THREE.BoxGeometry(BALC_W * 0.985, PH_PARAPET_H, 0.024),
      phRail: new THREE.BoxGeometry(BALC_W * 0.97, RAIL_H * 1.05, 0.006),
      phMainLeft: new THREE.BoxGeometry(PH_LEFT_W, PH_ROOM_H, WALL),
      phMainRight: new THREE.BoxGeometry(PH_RIGHT_W, PH_ROOM_H, WALL),
      phLeftSide: new THREE.BoxGeometry(WALL, PH_ROOM_H, PH_ROOM_D),
      phRightSide: new THREE.BoxGeometry(WALL, PH_ROOM_H, PH_ROOM_D),
      phRear: new THREE.BoxGeometry(W, PH_ROOM_H, WALL),
      phRoof: new THREE.BoxGeometry(W, PH_ROOF_T, PH_ROOM_D),
      phPlanter: new THREE.BoxGeometry(0.3, 0.046, 0.1),
      phShrub: new THREE.BoxGeometry(0.13, 0.11, 0.09),
    };
  }, []);

  useEffect(() => {
    return () => Object.values(geo).forEach((g) => g.dispose());
  }, [geo]);

  const floorY = (level: number, ex: number) =>
    GROUND_H + (level - 1) * FLOOR_H + ex * 0.3 * (level - 1);

  /** Medianeras hasta el piso 8. El penthouse del 9 trae sus propias paredes y techo. */
  const bodyFloors = Math.max(1, towerFloors - 1);
  const bodyH = GROUND_H + bodyFloors * FLOOR_H;
  const bodyY = bodyH / 2;

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

    if (group.current) {
      const target =
        idleSway && active == null
          ? Math.sin(state.clock.elapsedTime * 0.055) * 0.014
          : 0;
      group.current.rotation.y +=
        (target - group.current.rotation.y) * (1 - Math.exp(-1.8 * d));
    }
  });

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
        position={[0, bodyY, BACK_Z + WALL / 2]}
        scale={[1, bodyH, 1]}
        castShadow
        receiveShadow
        material={mat.stucco}
      />
      {/* Medianeras y contrafrente hasta el piso 8.
          El 9 trae las mismas paredes, cortadas en la fachada: la terraza queda al aire. */}
      <mesh
        geometry={geo.side}
        position={[-W / 2 + WALL / 2, bodyY, SIDE_Z]}
        scale={[1, bodyH, 1]}
        castShadow
        receiveShadow
        material={mat.stucco}
      />
      <mesh
        geometry={geo.side}
        position={[W / 2 - WALL / 2, bodyY, SIDE_Z]}
        scale={[1, bodyH, 1]}
        castShadow
        receiveShadow
        material={mat.stucco}
      />
      <mesh
        geometry={geo.interiorRear}
        position={[0, bodyY, BACK_Z + WALL + 0.012]}
        scale={[1, bodyH - SLAB_T * 2, 1]}
        material={mat.interior}
      />
      <mesh
        geometry={geo.interiorSide}
        position={[-W / 2 + WALL + FIT, bodyY, SIDE_Z]}
        scale={[1, bodyH - SLAB_T * 2, 1]}
        material={mat.interior}
      />
      <mesh
        geometry={geo.interiorSide}
        position={[W / 2 - WALL - FIT, bodyY, SIDE_Z]}
        scale={[1, bodyH - SLAB_T * 2, 1]}
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
        const terraceRoom = level === towerFloors;
        const typical = !terraceRoom;
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
        const wallY = SLAB_T / 2 + OPENING_H / 2;
        const glassY = SLAB_T / 2 + GLASS_OPEN_H / 2;
        const bandY = SLAB_T / 2 + GLASS_OPEN_H + BAND_H / 2;
        const balcScaleZ = terraceRoom ? PH_BALC_SCALE : 1;
        const balcZ = terraceRoom
          ? BALC_START + (BALC_D * balcScaleZ) / 2
          : BALC_Z;
        const railZ = terraceRoom
          ? BALC_START + BALC_D * balcScaleZ - 0.014
          : RAIL_Z;
        const facadeZ = terraceRoom
          ? PH_GLASS_Z
          : BALC_START + BALC_D * 0.5;
        const pentGlassMat = dimmed
          ? mat.glassDim
          : emphasised
            ? mat.glassEmph
            : mat.glassPent;
        const pentGlassX = -INNER_W / 2 + PH_LEFT_W + PH_GLASS_W / 2;
        const pentGlassY = SLAB_T / 2 + 0.02 + PH_GLASS_H / 2;
        const pentRoomY = SLAB_T / 2 + PH_ROOM_H / 2;
        const typicalSoffitZ = (BALC_START + BALC_D * 0.5 + RAIL_Z) / 2;

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

            {typical && (
              <>
                <mesh
                  geometry={geo.fasciaStrip}
                  position={[0, 0, railZ]}
                  material={mat.fasciaDark}
                />
                <mesh
                  geometry={geo.aptWall}
                  position={[aptWallX, wallY, facadeZ + APT_WALL_D / 2]}
                  castShadow={!lite}
                  receiveShadow
                  material={mat.stucco}
                />
                <mesh
                  geometry={geo.upperBand}
                  position={[
                    glassStart + GLASS_W / 2,
                    bandY,
                    facadeZ + BAND_D / 2,
                  ]}
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
                {[-1, 1].map((side) => (
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
              </>
            )}

            {bayXs.map((x) => (
              <mesh
                key={`rg-${x}`}
                geometry={geo.rearGlass}
                position={[x, glassY, BACK_Z - 0.006]}
                material={terraceRoom ? pentGlassMat : glassMat}
              />
            ))}

            {terraceRoom && (
              <>
                <mesh
                  geometry={geo.phParapet}
                  position={[0, SLAB_T / 2 + PH_PARAPET_H / 2, railZ]}
                  castShadow={!lite}
                  receiveShadow
                  material={mat.stucco}
                />
                <mesh
                  geometry={geo.phRail}
                  position={[
                    0,
                    SLAB_T / 2 + PH_PARAPET_H + RAIL_H * 0.41,
                    railZ + 0.004,
                  ]}
                  material={railMat}
                />
                <mesh
                  geometry={geo.phMainLeft}
                  position={[
                    -INNER_W / 2 + PH_LEFT_W / 2,
                    pentRoomY,
                    PH_GLASS_Z,
                  ]}
                  castShadow
                  receiveShadow
                  material={mat.stucco}
                />
                <mesh
                  geometry={geo.phMainRight}
                  position={[
                    INNER_W / 2 - PH_RIGHT_W / 2,
                    pentRoomY,
                    PH_GLASS_Z,
                  ]}
                  castShadow
                  receiveShadow
                  material={mat.stucco}
                />
                <mesh
                  geometry={geo.phLintel}
                  position={[
                    pentGlassX,
                    pentGlassY + PH_GLASS_H / 2 + 0.035,
                    PH_GLASS_Z,
                  ]}
                  castShadow={!lite}
                  receiveShadow
                  material={mat.stucco}
                />
                <mesh
                  geometry={geo.phGlassVoid}
                  position={[pentGlassX, pentGlassY, PH_GLASS_Z - 0.03]}
                  material={mat.interior}
                />
                <mesh
                  geometry={geo.phGlass}
                  position={[pentGlassX, pentGlassY, PH_GLASS_Z]}
                  material={pentGlassMat}
                />
                <mesh
                  geometry={geo.phLeftSide}
                  position={[
                    -W / 2 + WALL / 2,
                    pentRoomY,
                    PH_ROOM_Z,
                  ]}
                  castShadow
                  receiveShadow
                  material={mat.stucco}
                />
                <mesh
                  geometry={geo.phRightSide}
                  position={[
                    W / 2 - WALL / 2,
                    pentRoomY,
                    PH_ROOM_Z,
                  ]}
                  castShadow
                  receiveShadow
                  material={mat.stucco}
                />
                <mesh
                  geometry={geo.phRear}
                  position={[0, pentRoomY, BACK_Z + WALL / 2]}
                  castShadow
                  receiveShadow
                  material={mat.stucco}
                />
                <mesh
                  geometry={geo.phRoof}
                  position={[
                    0,
                    SLAB_T / 2 + PH_ROOM_H + PH_ROOF_T / 2,
                    PH_ROOM_Z,
                  ]}
                  castShadow
                  receiveShadow
                  material={mat.stucco}
                />
                {!lite && (
                  <>
                    <mesh
                      geometry={geo.phPlanter}
                      position={[
                        -BALC_W * 0.28,
                        SLAB_T / 2 + PH_PARAPET_H + 0.024,
                        railZ - 0.09,
                      ]}
                      material={mat.stucco}
                    />
                    <mesh
                      geometry={geo.phShrub}
                      position={[
                        -BALC_W * 0.32,
                        SLAB_T / 2 + PH_PARAPET_H + 0.1,
                        railZ - 0.08,
                      ]}
                      material={mat.foliageSun}
                      castShadow
                    />
                    <mesh
                      geometry={geo.phShrub}
                      position={[
                        -BALC_W * 0.2,
                        SLAB_T / 2 + PH_PARAPET_H + 0.08,
                        railZ - 0.09,
                      ]}
                      scale={[0.9, 0.75, 0.85]}
                      material={mat.foliageMid}
                    />
                  </>
                )}
              </>
            )}

            {!lite &&
              spotXs.map((x) => (
                <mesh
                  key={`spot-${x}`}
                  geometry={geo.spot}
                  position={[
                    x,
                    -SLAB_T / 2 - 0.004,
                    terraceRoom
                      ? typicalSoffitZ
                      : (facadeZ + railZ) / 2,
                  ]}
                  material={mat.spot}
                />
              ))}
          </group>
        );
      })}
    </group>
  );
}
