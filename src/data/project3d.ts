/**
 * Schema 3D por proyecto.
 * Unidades con `demo: true` son solo para probar la UI — NO inventario comercial real.
 */

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
      typology: "4 ambientes",
      surfaceM2: 178,
      status: "disponible",
      orientation: "Frente",
      demo: true,
    };
    const b: ProjectUnit = {
      id: `demo-${level}b`,
      code: `${level}02`,
      floor: level,
      typology: "4 ambientes",
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

export const beauchef3d: Project3DConfig = {
  projectSlug: "beauchef-620",
  status: "placeholder",
  schematicFloors: 9,
  placeholderNote:
    "Modelo 3D provisional. Masa esquemática — pendiente GLB oficial de Beauchef 620.",
  inventoryNote:
    "Inventario de demostración para la interfaz. Reemplazar con tipologías y disponibilidad oficiales.",
  floors: demoInventory.floors,
  units: demoInventory.units,
  hotspots: [
    {
      id: "lobby",
      label: "Lobby",
      kind: "lobby",
      position: [0, 0.45, 1.35],
      body: "Acceso y recepción del edificio.",
    },
    {
      id: "amenities",
      label: "Amenities",
      kind: "amenity",
      position: [1.1, 1.1, 1.1],
      body: "Espacios comunes del proyecto — detalle oficial pendiente.",
    },
    {
      id: "parking",
      label: "Cocheras",
      kind: "parking",
      position: [-1.05, 0.35, 0.9],
      body: "Acceso a cocheras en planta baja / subsuelo (esquema).",
    },
    {
      id: "rooftop",
      label: "Último nivel",
      kind: "rooftop",
      position: [0, 4.35, 0.35],
      body: "Nivel superior con unidad exclusiva y expansión.",
    },
  ],
  camera: {
    intro: {
      id: "intro",
      label: "Entrada",
      position: [2.2, 1.1, 3.4],
      target: [0.4, 1.8, 0],
    },
    overview: {
      id: "overview",
      label: "Vista general",
      position: [4.2, 2.6, 6.4],
      target: [0, 1.7, 0],
    },
    detail: {
      id: "detail",
      label: "Acercamiento",
      position: [2.8, 2.2, 4.2],
      target: [0, 2.1, 0],
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
      body: "Unidades amplias de cuatro ambientes, balcones con parrilla y luz natural como eje del proyecto.",
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
  "beauchef-620": beauchef3d,
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

export const HERO_PROJECT_SLUG = "beauchef-620";
