"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { SITE, SUN, type SceneMood } from "./sceneTokens";

type Props = {
  mood: SceneMood;
  /** Nubes muy tenues; se omiten en gama baja */
  clouds?: boolean;
  radius?: number;
  /** Baja la teselación del domo en móvil y gama baja */
  detail?: "low" | "medium" | "high";
};

/**
 * Cielo procedural: domo invertido con gradiente vertical calculado en el
 * fragment shader. Cero assets.
 *
 * Novedad respecto de la versión anterior: un halo solar. Es un solo
 * producto punto en el shader —coste despreciable— y es lo que le da
 * dirección y profundidad al cielo. Sin él, el gradiente plano hacía que
 * el edificio pareciera flotar en un fondo de estudio; con él hay una
 * fuente de luz visible que coincide con la dirección de la luz clave de
 * la escena, y la atmósfera se lee creíble.
 *
 * El color del halo sale de la paleta de marca (Off-White entibiado con
 * Camo), no de un amarillo de stock.
 */
export function SkyDome({
  mood,
  clouds = true,
  /* Radio acotado al far de cámara (~40): un domo de 60 se clippeaba. */
  radius = 32,
  detail = "high",
}: Props) {
  const uniforms = useMemo(
    () => ({
      uTop: {
        value: new THREE.Color(
          mood === "dusk" ? SITE.skyTopDusk : SITE.skyTopDay,
        ),
      },
      uHorizon: {
        value: new THREE.Color(
          mood === "dusk" ? SITE.skyHorizonDusk : SITE.skyHorizonDay,
        ),
      },
      uClouds: { value: clouds ? 1 : 0 },
      uCloudTint: { value: new THREE.Color(SITE.skyTopDay) },
      /* Dirección del sol: la MISMA que la directionalLight de la escena,
         normalizada. Si se mueve la luz, se mueve el halo. */
      uSunDir: {
        value: new THREE.Vector3(
          ...(mood === "dusk" ? SUN.dusk.dir : SUN.day.dir),
        ).normalize(),
      },
      uSunColor: {
        value: new THREE.Color(mood === "dusk" ? SUN.dusk.halo : SUN.day.halo),
      },
      uSunStrength: {
        value: mood === "dusk" ? SUN.dusk.strength : SUN.day.strength,
      },
    }),
    [mood, clouds],
  );

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms,
        vertexShader: /* glsl */ `
          varying vec3 vWorld;
          void main() {
            vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uTop;
          uniform vec3 uHorizon;
          uniform vec3 uCloudTint;
          uniform vec3 uSunDir;
          uniform vec3 uSunColor;
          uniform float uSunStrength;
          uniform float uClouds;
          varying vec3 vWorld;

          float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
          }
          float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(
              mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
              mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
              u.y
            );
          }

          void main() {
            vec3 dir = normalize(vWorld);

            float h = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);
            float t = pow(smoothstep(0.42, 1.0, h), 0.85);
            vec3 col = mix(uHorizon, uTop, t);

            // Halo solar: ancho y suave, sin disco duro. Da dirección
            // al cielo y calidez alrededor de la fuente de luz.
            float sun = max(dot(dir, uSunDir), 0.0);
            float halo = pow(sun, 5.0) * 0.55 + pow(sun, 42.0) * 0.45;
            col = mix(col, uSunColor, clamp(halo * uSunStrength, 0.0, 0.85));

            if (uClouds > 0.5 && dir.y > 0.02) {
              vec2 uv = dir.xz / max(dir.y, 0.12) * 0.55;
              float n = noise(uv * 1.6) * 0.6 + noise(uv * 3.7) * 0.4;
              float band = smoothstep(0.06, 0.5, dir.y) * (1.0 - smoothstep(0.62, 1.0, dir.y));
              float c = smoothstep(0.5, 0.85, n) * band * 0.26;
              // Las nubes cerca del sol se iluminan: recorta el aspecto
              // de calcomanía uniforme.
              vec3 tint = mix(uCloudTint, uSunColor, pow(sun, 3.0) * 0.6);
              col = mix(col, tint, c);
            }

            gl_FragColor = vec4(col, 1.0);
            #include <colorspace_fragment>
          }
        `,
      }),
    [uniforms],
  );

  /* El domo es un fondo: no necesita silueta fina. En móvil 12×8 ahorra
     ~700 triángulos y el gradiente se ve idéntico porque el color se
     calcula por píxel, no por vértice. */
  const geometry = useMemo(() => {
    const seg = detail === "high" ? 24 : detail === "medium" ? 16 : 12;
    return new THREE.SphereGeometry(radius, seg, Math.round(seg * 0.66));
  }, [radius, detail]);

  return (
    <mesh geometry={geometry} material={material} frustumCulled={false} />
  );
}
