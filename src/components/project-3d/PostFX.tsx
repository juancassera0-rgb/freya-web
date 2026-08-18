"use client";

import { EffectComposer, N8AO, SMAA } from "@react-three/postprocessing";
import { BRAND } from "./sceneTokens";

/**
 * Post-procesado — sólo lo que suma lectura arquitectónica, nada más.
 *
 * Un único efecto: oclusión ambiental (N8AO) para el contacto entre losa y
 * vidrio, entre montantes, bajo la baranda — exactamente donde la escena
 * sin GI se ve plana — más SMAA para afinar los bordes finos (mullones,
 * cantos de losa) que el AA nativo del canvas deja tembloroso al orbitar.
 *
 * Nada de bloom, DOF ni viñeta: el brief es explícito en que el resultado
 * tiene que leerse como más realismo, no como un efecto. `aoRadius` está en
 * unidades de escena (la torre mide ~4.2 de alto), así que un radio de
 * escala "arquitectónica" (0.4-1.5 en assets reales) acá tiene que ser
 * mucho más chico o mancha toda la fachada.
 *
 * Sólo se monta en tier "high" y con puntero fino (ver el gate en las
 * escenas) — es el único costo de este pase que no tiene degradación
 * progresiva propia, así que se lo reserva para el hardware que ya sobra.
 */
export function PostFX() {
  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      <N8AO
        aoRadius={0.3}
        distanceFalloff={1}
        intensity={1.4}
        quality="medium"
        color={BRAND.offBlack}
        halfRes
      />
      <SMAA />
    </EffectComposer>
  );
}
