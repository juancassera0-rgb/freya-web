"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { SITE, type SceneMood } from "./sceneTokens";

type Props = {
  mood: SceneMood;
  /** Nubes muy tenues; se omiten en gama baja */
  clouds?: boolean;
  radius?: number;
};

/**
 * Cielo procedural: domo invertido con gradiente vertical calculado en el
 * fragment shader. Cero assets — ni HDRI ni texturas, así que no suma un
 * solo KB al bundle.
 *
 * Los colores salen de sceneTokens, o sea de la paleta de marca: el cielo
 * de día es Off-White con una caída muy leve, y el de atardecer se apoya
 * en Camo. No hay celeste de stock en ninguna parte.
 *
 * Las nubes son ruido de valor de dos octavas, apenas perceptible: dan
 * profundidad sin convertir la escena en una postal.
 */
export function SkyDome({ mood, clouds = true, radius = 60 }: Props) {
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
          uniform float uClouds;
          varying vec3 vWorld;

          // Ruido de valor barato — sin texturas
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

            // Gradiente vertical con caída suave hacia el horizonte
            float h = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);
            float t = pow(smoothstep(0.42, 1.0, h), 0.85);
            vec3 col = mix(uHorizon, uTop, t);

            // Nubes: dos octavas, sólo por encima del horizonte
            if (uClouds > 0.5 && dir.y > 0.02) {
              vec2 uv = dir.xz / max(dir.y, 0.12) * 0.55;
              float n = noise(uv * 1.6) * 0.6 + noise(uv * 3.7) * 0.4;
              float band = smoothstep(0.06, 0.5, dir.y) * (1.0 - smoothstep(0.62, 1.0, dir.y));
              float c = smoothstep(0.52, 0.86, n) * band * 0.22;
              col = mix(col, uCloudTint, c);
            }

            gl_FragColor = vec4(col, 1.0);
            #include <colorspace_fragment>
          }
        `,
      }),
    [uniforms],
  );

  const geometry = useMemo(
    () => new THREE.SphereGeometry(radius, 24, 16),
    [radius],
  );

  return (
    <mesh geometry={geometry} material={material} frustumCulled={false} />
  );
}
