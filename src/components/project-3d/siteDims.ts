/**
 * Cotas compartidas del lote / masa — fuente única para massing, vereda
 * y medianeras. Si cambia ArchitecturalMassing, cambia acá (o al revés).
 *
 * Escala de escena: 1 unidad ≈ ~2.5–3 m de calle real. Beauchef 620 es un
 * lote angosto de Caballito con frente a calle, medianeras laterales y
 * fondo de manzana — no una torre aislada en un parque.
 */
export const SITE_DIMS = {
  /** Frente angosto — silueta ~1:3.4 como los renders de Beauchef 620. */
  W: 1.36,
  D: 2.45,
  FLOOR_H: 0.42,
  /** PB más alto que un piso tipo. */
  GROUND_H: 0.74,
  /** Balcón profundo; el vuelo extra hacia la calle no ensancha la losa. */
  CANTILEVER: 0.48,
  /** Losa leída como 25–30 cm. */
  SLAB_T: 0.078,
  /** Medianeras-marco: gruesas, estructurales. */
  WALL: 0.11,
  FRONT_Z: 0.2,
  BACK_Z: -0.92,
} as const;

export function towerTotalH(floors: number): number {
  return SITE_DIMS.GROUND_H + floors * SITE_DIMS.FLOOR_H;
}
