/**
 * GEOMETRÍA DE PLANTA — FUENTE ÚNICA PARA 2D Y 3D.
 *
 * El plano técnico (SVG) y la planta volumétrica (Three.js) se generan desde
 * estos mismos rectángulos. Por eso el morph 2D↔3D es continuo: no son dos
 * recursos distintos, es la misma geometría con la altura de muro interpolada.
 *
 * Coordenadas normalizadas 0→1 sobre la envolvente de la unidad.
 * Origen (0,0) = esquina superior izquierda del plano.
 *
 * NOTA: la distribución es esquemática y se deriva de la tipología declarada
 * en los datos del proyecto. No representa el plano oficial de obra.
 */

export type RoomKind =
  | "living"
  | "cocina"
  | "dormitorio"
  | "bano"
  | "balcon"
  | "circulacion";

export type PlanRoom = {
  id: string;
  label: string;
  kind: RoomKind;
  /** Rect normalizado dentro de la envolvente */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Render asociado a este espacio, si el proyecto lo tiene */
  renderSrc?: string;
  renderAlt?: string;
};

export type PlanOpening = {
  /** Posición normalizada del centro de la abertura */
  x: number;
  y: number;
  kind: "puerta" | "ventana";
  /** horizontal | vertical */
  axis: "h" | "v";
  /** Ancho normalizado */
  size: number;
};

export type UnitPlan = {
  rooms: PlanRoom[];
  openings: PlanOpening[];
  /** Proporción ancho/alto de la envolvente — mantiene la escala coherente */
  aspect: number;
  /** El balcón se adosa fuera de la envolvente principal */
  balconyWidth: number;
};

/** Renders por espacio, sólo donde el proyecto realmente los tiene. */
export type RoomRenderMap = Partial<
  Record<RoomKind, { src: string; alt: string }>
>;

/**
 * Construye la planta a partir de la tipología ("4 ambientes", "2 ambientes"…).
 * Zona social a la izquierda, dormitorios y baño apilados a la derecha,
 * balcón corrido sobre el frente.
 */
export function buildUnitPlan(
  typology: string,
  renders: RoomRenderMap = {},
): UnitPlan {
  const ambientes = Math.max(1, parseInt(typology, 10) || 2);
  const bedrooms = Math.max(1, ambientes - 1);

  const socialW = 0.56;
  const privateX = socialW;
  const privateW = 1 - socialW;

  const kitchenH = 0.3;
  const livingH = 1 - kitchenH;

  const rooms: PlanRoom[] = [
    {
      id: "living",
      label: "Living / comedor",
      kind: "living",
      x: 0,
      y: 0,
      w: socialW,
      h: livingH,
      renderSrc: renders.living?.src,
      renderAlt: renders.living?.alt,
    },
    {
      id: "cocina",
      label: "Cocina",
      kind: "cocina",
      x: 0,
      y: livingH,
      w: socialW,
      h: kitchenH,
      renderSrc: renders.cocina?.src,
      renderAlt: renders.cocina?.alt,
    },
  ];

  // Dormitorios + baño reparten la franja privada
  const cells = bedrooms + 1;
  const cellH = 1 / cells;

  for (let i = 0; i < bedrooms; i++) {
    rooms.push({
      id: `dorm-${i + 1}`,
      label: `Dormitorio ${i + 1}`,
      kind: "dormitorio",
      x: privateX,
      y: i * cellH,
      w: privateW,
      h: cellH,
      renderSrc: i === 0 ? renders.dormitorio?.src : undefined,
      renderAlt: i === 0 ? renders.dormitorio?.alt : undefined,
    });
  }

  rooms.push({
    id: "bano",
    label: "Baño",
    kind: "bano",
    x: privateX,
    y: bedrooms * cellH,
    w: privateW,
    h: cellH,
  });

  const balconyWidth = 0.14;
  rooms.push({
    id: "balcon",
    label: "Balcón",
    kind: "balcon",
    x: 1,
    y: 0,
    w: balconyWidth,
    h: 1,
    renderSrc: renders.balcon?.src,
    renderAlt: renders.balcon?.alt,
  });

  const openings: PlanOpening[] = [
    // Puerta living → cocina
    { x: socialW * 0.45, y: livingH, kind: "puerta", axis: "h", size: 0.12 },
    // Puerta social → privado
    { x: privateX, y: livingH * 0.4, kind: "puerta", axis: "v", size: 0.1 },
    // Ventanal del living al balcón
    { x: 1, y: livingH * 0.5, kind: "ventana", axis: "v", size: 0.42 },
    // Ventana de dormitorio 1
    { x: 1, y: cellH * 0.5, kind: "ventana", axis: "v", size: 0.2 },
  ];

  return { rooms, openings, aspect: 1.6, balconyWidth };
}

/** Etiqueta corta para hotspots y navegación. */
export function roomShortLabel(room: PlanRoom): string {
  if (room.kind === "living") return "Living";
  if (room.kind === "cocina") return "Cocina";
  if (room.kind === "balcon") return "Balcón";
  if (room.kind === "bano") return "Baño";
  return room.label;
}

/** Sólo los ambientes que tienen render real asociado. */
export function roomsWithRenders(plan: UnitPlan): PlanRoom[] {
  return plan.rooms.filter((r) => Boolean(r.renderSrc));
}
