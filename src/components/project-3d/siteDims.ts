/**
 * Cotas compartidas del lote / masa — fuente única para massing, vereda
 * y medianeras. Si cambia ArchitecturalMassing, cambia acá (o al revés).
 *
 * Escala de escena: 1 unidad ≈ ~2.5–3 m de calle real. Beauchef 620 es un
 * lote angosto de Caballito con frente a calle, medianeras laterales y
 * fondo de manzana — no una torre aislada en un parque.
 */
export const SITE_DIMS = {
  W: 1.62,
  D: 2.45,
  FLOOR_H: 0.4,
  GROUND_H: 0.62,
  /** Voladizo a CALLE únicamente — ~1.1 m. Nunca atraviesa medianera. */
  CANTILEVER: 0.38,
  SLAB_T: 0.052,
  /** Espesor de medianera / contrafrente. */
  WALL: 0.07,
  /** Plano de vidrio a calle. */
  FRONT_Z: 0.28,
  /** Plano ciego de contrafrente — el prisma cierra acá. */
  BACK_Z: -0.95,
} as const;

export function towerTotalH(floors: number): number {
  return SITE_DIMS.GROUND_H + floors * SITE_DIMS.FLOOR_H;
}
