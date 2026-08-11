import * as THREE from "three";

/**
 * COLORES DE ESCENA — FUENTE ÚNICA, DERIVADA DE LA MARCA.
 *
 * Manual de marca FREYA: la paleta oficial son tres colores y no se
 * incorporan otros sin aprobación del equipo de marca.
 *
 *   Off-White  #F6F6F6  fondo base, luminosidad y limpieza
 *   Camo       #4F4C37  color distintivo: naturaleza, estructura, sobriedad
 *   Off-Black  #1D1C1B  tipografía, nunca negro puro
 *
 * Por eso el entorno NO usa verdes ni celestes de stock: cada color de
 * abajo se calcula a partir de esos tres, mezclando y ajustando
 * luminosidad. El Camo es literalmente el color "naturaleza" de la marca,
 * así que toda la vegetación sale de ahí — verde oliva apagado, no césped.
 * El cielo se construye sobre Off-White. Vereda y asfalto son grises
 * CÁLIDOS derivados de Off-Black, nunca grises azulados.
 *
 * Si algo del entorno necesita un color nuevo, se agrega acá y se deriva
 * de la paleta. No se escriben hex sueltos en los componentes.
 */

/* ---------- Paleta oficial ---------- */
export const BRAND = {
  offWhite: "#f6f6f6",
  camo: "#4f4c37",
  offBlack: "#1d1c1b",
} as const;

const OFF_WHITE = new THREE.Color(BRAND.offWhite);
const CAMO = new THREE.Color(BRAND.camo);
const OFF_BLACK = new THREE.Color(BRAND.offBlack);

/** Mezcla dos colores de marca y devuelve el hex resultante */
function mix(a: THREE.Color, b: THREE.Color, t: number): string {
  return `#${a.clone().lerp(b, t).getHexString()}`;
}

/** Aclara u oscurece manteniendo el matiz de marca */
function shade(base: THREE.Color, amount: number): string {
  const c = base.clone();
  const target = amount > 0 ? OFF_WHITE : OFF_BLACK;
  return `#${c.lerp(target, Math.abs(amount)).getHexString()}`;
}

/**
 * Sube saturación y luminosidad MANTENIENDO EL MATIZ.
 *
 * El Camo es un oliva muy desaturado: perfecto para superficies, pero la
 * vegetación con ese valor exacto se ve mustia. Esto la trae a la vida sin
 * salirse de la familia cromática — el tono sigue siendo el de la marca,
 * sólo con más vida. El hue nunca se toca.
 */
function vivify(base: THREE.Color, sat: number, light: number): string {
  const hsl = { h: 0, s: 0, l: 0 };
  base.getHSL(hsl);
  const c = new THREE.Color().setHSL(
    hsl.h, // matiz de marca intacto
    Math.min(1, hsl.s + sat),
    Math.min(0.95, Math.max(0.05, hsl.l + light)),
  );
  return `#${c.getHexString()}`;
}

/**
 * Colores del emplazamiento. Cada entrada documenta de dónde sale.
 */
export const SITE = {
  /* --- Cielo: Off-White como base, apenas entibiado --- */
  skyTopDay: shade(OFF_WHITE, -0.12), // off-white levemente bajado
  skyHorizonDay: shade(OFF_WHITE, 0.0), // off-white puro en el horizonte
  skyTopDusk: mix(OFF_BLACK, CAMO, 0.35), // noche cálida con base camo
  skyHorizonDusk: mix(CAMO, OFF_WHITE, 0.62), // resplandor bajo, arena

  /* --- Vegetación: matiz del Camo, con vida ---
     Mismo hue que el color "naturaleza" de la marca, pero con saturación
     y luz suficientes para que el follaje se lea vivo y no mustio. */
  grass: vivify(CAMO, 0.14, 0.04), // césped del cantero
  grassLight: vivify(CAMO, 0.18, 0.13), // borde iluminado
  foliage: vivify(CAMO, 0.2, 0.06), // copa en sombra
  foliageMid: vivify(CAMO, 0.26, 0.14), // copa media
  foliageLight: vivify(CAMO, 0.3, 0.22), // copa al sol
  trunk: mix(OFF_BLACK, CAMO, 0.5), // tronco: marrón cálido de marca

  /* --- Suelo urbano: grises CÁLIDOS desde Off-Black --- */
  sidewalk: mix(OFF_BLACK, OFF_WHITE, 0.68), // vereda clara
  sidewalkJoint: mix(OFF_BLACK, OFF_WHITE, 0.55), // junta entre baldosas
  curb: mix(OFF_BLACK, OFF_WHITE, 0.58), // cordón
  asphalt: mix(OFF_BLACK, OFF_WHITE, 0.3), // calzada
  asphaltLine: mix(OFF_BLACK, OFF_WHITE, 0.72), // marca vial tenue

  /* --- Contexto construido --- */
  neighbour: mix(OFF_WHITE, OFF_BLACK, 0.13), // vecinos, off-white apagado
  neighbourShade: mix(OFF_WHITE, OFF_BLACK, 0.26), // sus caras en sombra

  /* --- El edificio --- */
  stucco: shade(OFF_WHITE, -0.03), // medianeras y parapetos
  slabFascia: mix(CAMO, OFF_WHITE, 0.66), // frente de losa, arena
  soffit: mix(CAMO, OFF_WHITE, 0.74), // intradós del balcón
  glass: mix(OFF_BLACK, CAMO, 0.55), // vidriado
  glassLit: mix(CAMO, OFF_WHITE, 0.52), // vidrio con luz interior
  mullion: mix(OFF_BLACK, CAMO, 0.25), // montantes
  rail: mix(OFF_WHITE, CAMO, 0.16), // baranda de vidrio
  groundFloor: mix(OFF_BLACK, OFF_WHITE, 0.62), // basamento
} as const;

/** Ambiente lumínico según la hora representada */
export const MOOD = {
  day: {
    key: shade(OFF_WHITE, 0.0), // sol neutro y limpio
    fill: mix(OFF_WHITE, CAMO, 0.1), // relleno frío-neutro
    ambient: mix(OFF_WHITE, CAMO, 0.14),
    keyIntensity: 1.85,
    ambientIntensity: 0.34,
    exposure: 1.1,
    fogNear: 16,
    fogFar: 46,
  },
  dusk: {
    key: mix(OFF_WHITE, CAMO, 0.28), // sol bajo, cálido
    fill: mix(OFF_BLACK, CAMO, 0.5),
    ambient: mix(OFF_BLACK, CAMO, 0.42),
    keyIntensity: 1.5,
    ambientIntensity: 0.26,
    exposure: 1.16,
    fogNear: 12,
    fogFar: 38,
  },
} as const;

export type SceneMood = keyof typeof MOOD;
