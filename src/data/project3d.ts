/**
 * Schema 3D por proyecto.
 * Unidades con `demo: true` son solo para probar la UI — NO inventario comercial real.
 */

import type { RoomRenderMap } from "./planGeometry";

export type UnitStatus = "disponible" | "reservado" | "vendido";

export type ProjectUnit = {
  id: string;
  code: string;
  floor: number;
  typology: string;
  surfaceM2: number;
  status: UnitStatus;
  orientation?: string;
  planImage?: string;
  modelUrl?: string;
  /** true = datos de demostración de UI, no comerciales */
  demo?: boolean;
};

export type ProjectFloor = {
  level: number;
  label: string;
  unitIds: string[];
};

export type ProjectHotspot = {
  id: string;
  label: string;
  kind: "amenity" | "lobby" | "rooftop" | "parking" | "unit-premium";
  position: [number, number, number];
  body?: string;
};

export type CameraWaypoint = {
  id: string;
  label: string;
  position: [number, number, number];
  target: [number, number, number];
};

export type StoryChapter = {
  id: string;
  index: string;
  title: string;
  body: string;
  cameraAt: number;
  highlightFloor?: number | null;
};

export type Project3DConfig = {
  projectSlug: string;
  status: "placeholder" | "ready";
  modelUrl?: string;
  schematicFloors: number;
  floors: ProjectFloor[];
  units: ProjectUnit[];
  hotspots: ProjectHotspot[];
  /**
   * Renders reales del proyecto asociados a espacios de la unidad.
   * Sólo se listan los que existen entre los assets — el explorador
   * únicamente ofrece "ver render" en los ambientes presentes acá.
   */
  roomRenders?: RoomRenderMap;
  /** Renders de espacios comunes / exterior, para los hotspots del edificio */
  commonRenders?: { id: string; src: string; alt: string }[];
  camera: {
    intro: CameraWaypoint;
    overview: CameraWaypoint;
    detail: CameraWaypoint;
  };
  story: StoryChapter[];
  placeholderNote: string;
  inventoryNote?: string;
};

function demoUnitsForFloors(floors: number): {
  floors: ProjectFloor[];
  units: ProjectUnit[];
} {
  const units: ProjectUnit[] = [];
  const floorList: ProjectFloor[] = [];

  for (let level = 1; level <= floors; level++) {
    const a: ProjectUnit = {
      id: `demo-${level}a`,
      code: `${level}01`,
      floor: level,
      typology: "Cuadrado",
      surfaceM2: 178,
      status: "disponible",
      orientation: "Frente",
      demo: true,
    };
    const b: ProjectUnit = {
      id: `demo-${level}b`,
      code: `${level}02`,
      floor: level,
      typology: "Cuadrado",
      surfaceM2: 185,
      status: level % 4 === 0 ? "reservado" : "disponible",
      orientation: "Contrafrente",
      demo: true,
    };
    units.push(a, b);
    floorList.push({
      level,
      label: `Piso ${level}`,
      unitIds: [a.id, b.id],
    });
  }

  return { floors: floorList, units };
}

const demoInventory = demoUnitsForFloors(9);

export const sow3d: Project3DConfig = {
  projectSlug: "sow",
  status: "placeholder",
  schematicFloors: 9,
  placeholderNote:
    "Modelo 3D provisional. Masa esquemática — pendiente GLB oficial de Sow.",
  inventoryNote:
    "Inventario de demostración para la interfaz. Reemplazar con tipologías y disponibilidad oficiales.",
  floors: demoInventory.floors,
  units: demoInventory.units,
  /**
   * Renders reales existentes en /public/images/projects para Sow.
   * El living es el único interior disponible hoy; cuando lleguen más
   * renders por ambiente se agregan acá y el explorador los toma solo.
   */
  roomRenders: {
    living: {
      src: "/images/projects/beauchef-living.jpg",
      alt: "Living comedor de Sow",
    },
  },
  commonRenders: [
    {
      id: "lobby",
      src: "/images/projects/beauchef-acceso.jpg",
      alt: "Acceso y lobby de Sow",
    },
    {
      id: "fachada",
      src: "/images/projects/beauchef-cover.jpg",
      alt: "Fachada de Sow",
    },
    {
      id: "fachada-atardecer",
      src: "/images/projects/beauchef-dusk.jpg",
      alt: "Sow al atardecer",
    },
  ],
  hotspots: [
    {
      id: "lobby",
      label: "Lobby",
      kind: "lobby",
      position: [0, 0.4, 1.35],
      body: "Acceso y recepción del edificio.",
    },
    {
      id: "amenities",
      label: "Amenities",
      kind: "amenity",
      position: [1.05, 1.5, 1.15],
      body: "Espacios comunes del proyecto — detalle oficial pendiente.",
    },
    {
      id: "parking",
      label: "Cocheras",
      kind: "parking",
      position: [-0.95, 0.3, 1.1],
      body: "Acceso a cocheras en planta baja / subsuelo (esquema).",
    },
    {
      id: "rooftop",
      label: "Último nivel",
      kind: "rooftop",
      position: [0, 4.15, 0.55],
      body: "Nivel superior con unidad exclusiva y expansión.",
    },
  ],
  /**
   * Encuadres calibrados a la volumetría real (torre angosta, ~4.2 de alto).
   * Intro: contrapicado desde la vereda. Overview: tres cuartos, el ángulo
   * de los renders. Detail: aproximación a las losas de balcón.
   */
  camera: {
    intro: {
      id: "intro",
      label: "Entrada",
      position: [2.4, 0.9, 3.6],
      target: [0.2, 2.2, 0],
    },
    overview: {
      id: "overview",
      label: "Vista general",
      position: [4.9, 3.1, 6.1],
      target: [0, 2.05, 0],
    },
    detail: {
      id: "detail",
      label: "Acercamiento",
      position: [3.0, 2.6, 3.9],
      target: [0, 2.4, 0],
    },
  },
  story: [
    {
      id: "architecture",
      index: "01",
      title: "Arquitectura",
      body: "Líneas puras, proporciones equilibradas y una fachada contemporánea pensada para perdurar en Caballito.",
      cameraAt: 0.15,
    },
    {
      id: "location",
      index: "02",
      title: "Ubicación",
      body: "Beauchef, entre Valle y Av. Pedro Goyena — un barrio con historia, proyección y vida cotidiana completa.",
      cameraAt: 0.4,
    },
    {
      id: "living",
      index: "03",
      title: "Habitar",
      body: "Cuadrados amplios, balcones con parrilla y luz natural como eje del proyecto.",
      cameraAt: 0.65,
      highlightFloor: 5,
    },
    {
      id: "units",
      index: "04",
      title: "Elegí tu nivel",
      body: "Explorá los pisos del esquema. Cuando el modelo oficial esté disponible, cada nivel conectará con unidades reales.",
      cameraAt: 0.9,
      highlightFloor: 8,
    },
  ],
};

const configs: Record<string, Project3DConfig> = {
  "sow": sow3d,
};

export function getProject3D(slug: string): Project3DConfig | undefined {
  return configs[slug];
}

export function hasProject3D(slug: string): boolean {
  return Boolean(configs[slug]);
}

export function getUnit(
  config: Project3DConfig,
  unitId: string,
): ProjectUnit | undefined {
  return config.units.find((u) => u.id === unitId);
}

export function getUnitsForFloor(
  config: Project3DConfig,
  floor: number,
): ProjectUnit[] {
  return config.units.filter((u) => u.floor === floor);
}

export const HERO_PROJECT_SLUG = "sow";
