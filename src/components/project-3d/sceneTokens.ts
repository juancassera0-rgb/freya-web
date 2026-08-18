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
 * abajo se calcula a partir de esos tres. El Camo es literalmente el color
 * "naturaleza" de la marca, así que toda la vegetación sale de ahí. El
 * cielo se construye sobre Off-White. Vereda y asfalto son grises CÁLIDOS
 * derivados de Off-Black, nunca grises azulados.
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
 * salirse de la familia cromática — el hue nunca se toca.
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
  skyTopDay: shade(OFF_WHITE, -0.2),
  skyHorizonDay: mix(OFF_WHITE, CAMO, 0.08),
  skyTopDusk: mix(OFF_BLACK, CAMO, 0.35), // noche cálida con base camo
  skyHorizonDusk: mix(CAMO, OFF_WHITE, 0.62), // resplandor bajo, arena

  /* --- Vegetación: matiz del Camo, con vida ---
     Se ampliaron los tonos a cinco. Con tres, el follaje instanciado
     mostraba repetición evidente en cuanto había más de tres árboles;
     con cinco la copa se lee modulada y el barrio deja de parecer un
     patrón. Todos comparten el hue del Camo. */
  grass: vivify(CAMO, 0.14, 0.04), // césped del cantero
  grassLight: vivify(CAMO, 0.18, 0.13), // borde iluminado
  foliageDeep: vivify(CAMO, 0.16, -0.02), // masa interior, en sombra
  foliage: vivify(CAMO, 0.2, 0.06), // copa en sombra
  foliageMid: vivify(CAMO, 0.26, 0.14), // copa media
  foliageLight: vivify(CAMO, 0.32, 0.22), // copa al sol
  foliageSun: vivify(CAMO, 0.36, 0.3), // remate, punto de máxima luz
  trunk: mix(OFF_BLACK, CAMO, 0.5), // tronco: marrón cálido de marca
  /* Arbolado lejano: la silueta se desatura y se aclara con la distancia.
     Es niebla aérea resuelta en el color, no un efecto extra. */
  /* `vivify` devuelve un hex y `mix` opera sobre THREE.Color: hay que
     reconstruir el color antes de mezclarlo con el off-white.
     (El patch pasaba el string directo y no compilaba.) */
  treeLineFar: mix(new THREE.Color(vivify(CAMO, 0.06, 0.16)), OFF_WHITE, 0.52),
  treeLineNear: mix(new THREE.Color(vivify(CAMO, 0.1, 0.1)), OFF_WHITE, 0.34),

  /* --- Suelo urbano: grises CÁLIDOS desde Off-Black --- */
  sidewalk: mix(OFF_BLACK, OFF_WHITE, 0.68), // vereda clara
  sidewalkJoint: mix(OFF_BLACK, OFF_WHITE, 0.55), // junta entre baldosas
  curb: mix(OFF_BLACK, OFF_WHITE, 0.58), // cordón
  asphalt: mix(OFF_BLACK, OFF_WHITE, 0.3), // calzada
  asphaltLine: mix(OFF_BLACK, OFF_WHITE, 0.72), // marca vial tenue

  /* --- Contexto construido --- */
  neighbour: mix(OFF_WHITE, OFF_BLACK, 0.13), // vecinos, off-white apagado
  neighbourShade: mix(OFF_WHITE, OFF_BLACK, 0.26), // sus caras en sombra
  /* Fila más lejana de vecinos: la misma niebla aérea que el arbolado
     lejano, para que la profundidad se lea continua entre ambas capas. */
  neighbourFar: mix(new THREE.Color(mix(OFF_WHITE, OFF_BLACK, 0.16)), OFF_WHITE, 0.45),

  /* --- El edificio ---
     Lectura de render arquitectónico, no maqueta blanca:
     revoque cálido (no paper-white), losa más arena, vidrio oscuro,
     interior profundo. El contraste entre estas capas es lo que hace
     que el volumen se lea construido. */
  stucco: mix(OFF_WHITE, CAMO, 0.32),
  slabFascia: mix(CAMO, OFF_WHITE, 0.38),
  party: mix(OFF_WHITE, OFF_BLACK, 0.28),
  soffit: mix(CAMO, OFF_BLACK, 0.34),
  glass: mix(OFF_BLACK, CAMO, 0.2),
  glassLit: mix(CAMO, OFF_WHITE, 0.3),
  mullion: mix(OFF_BLACK, CAMO, 0.08),
  rail: mix(OFF_BLACK, CAMO, 0.14),
  railCap: mix(OFF_BLACK, CAMO, 0.06),
  groundFloor: mix(OFF_BLACK, OFF_WHITE, 0.4),
  interior: mix(OFF_BLACK, CAMO, 0.1),
  interiorLit: mix(CAMO, OFF_WHITE, 0.32),
} as const;

/**
 * SOL — dirección y halo.
 *
 * La dirección debe coincidir con la `directionalLight` clave de cada
 * escena; el SkyDome dibuja el halo ahí. Cuando se mueva la luz, se mueve
 * este vector: si se desincronizan, el halo aparece en un lado y las
 * sombras caen del otro, y la escena deja de leerse creíble.
 */
export const SUN = {
  day: {
    dir: [6, 9, 4] as [number, number, number],
    halo: mix(OFF_WHITE, CAMO, 0.07), // blanco apenas cálido
    strength: 0.55,
  },
  dusk: {
    dir: [7, 5.5, 5] as [number, number, number],
    halo: mix(CAMO, OFF_WHITE, 0.72), // resplandor arena
    strength: 0.9,
  },
} as const;

/** Ambiente lumínico según la hora representada */
export const MOOD = {
  day: {
    key: shade(OFF_WHITE, 0.0), // sol neutro y limpio
    fill: mix(OFF_WHITE, CAMO, 0.1), // relleno frío-neutro
    ambient: mix(OFF_WHITE, CAMO, 0.14),
    /* Rebote del suelo: cálido y tenue. Ilumina intradoses de balcón y
       bajo-losas, que es donde una escena sin GI se ve muerta. */
    bounce: mix(CAMO, OFF_WHITE, 0.55),
    /* Contraste levemente más marcado: sol un poco más presente, relleno
       ambiental un poco más contenido. El edificio tiene que separarse del
       entorno con luz, no sólo con color — sobre todo ahora que hay
       vecinos reales alrededor compitiendo por atención. */
    keyIntensity: 2.25,
    ambientIntensity: 0.16,
    exposure: 1.08,
    /* fogFar debe quedar DENTRO de camera.far (40) o el cielo/árboles "pop". */
    fogNear: 12,
    fogFar: 36,
  },
  dusk: {
    key: mix(OFF_WHITE, CAMO, 0.28), // sol bajo, cálido
    fill: mix(OFF_BLACK, CAMO, 0.5),
    ambient: mix(OFF_BLACK, CAMO, 0.42),
    bounce: mix(CAMO, OFF_WHITE, 0.35),
    keyIntensity: 1.62,
    ambientIntensity: 0.2,
    exposure: 1.12,
    fogNear: 10,
    fogFar: 34,
  },
} as const;

export type SceneMood = keyof typeof MOOD;
