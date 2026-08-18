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
 *
 * NO ESTÁ IMPORTADO EN NINGUNA ESCENA todavía — a propósito. Dos sesiones
 * distintas intentaron confirmarlo visualmente en el navegador de
 * automatización disponible acá y no se pudo: se aisló el problema hasta
 * comprobar, con un <Canvas> vacío sin una sola línea de este repo, que
 * WebGL no renderiza ni un frame en ese entorno (el framebuffer queda en
 * 0×0 píxeles reales). No es un bug de la app ni de este efecto — es una
 * limitación del navegador de esa sesión. El brief pide explícitamente no
 * habilitar post-procesado sin confirmar visualmente que mejora el
 * resultado, así que la decisión correcta mientras eso siga sin poder
 * verificarse es dejarlo listo pero apagado, no adivinar.
 *
 * Para habilitarlo: importar `PostFX` en `Project3DScene.tsx` y
 * `SalesCenterScene.tsx`, montarlo como `{high && !touch && <PostFX />}`
 * al final del `<Canvas>` (después de `children`), y mirarlo en un
 * navegador real antes de commitear.
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
