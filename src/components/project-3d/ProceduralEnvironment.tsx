"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { SITE, type SceneMood } from "./sceneTokens";

type Props = {
  mood: SceneMood;
};

/**
 * Mapa de entorno generado en runtime — sin HDRI ni descargas.
 *
 * Construye una escena mínima (gradiente de cielo + plano de suelo) y la
 * convierte en un cubemap prefiltrado con PMREMGenerator. Eso es lo que
 * hace que el vidriado refleje el cielo y se lea como vidrio en vez de
 * como plástico azul.
 *
 * Se genera UNA sola vez por mood: 64px de resolución alcanzan de sobra
 * para reflejos difusos y el coste es despreciable. Cero KB de assets.
 */
export function ProceduralEnvironment({ mood }: Props) {
  const gl = useThree((s) => s.gl);

  /**
   * El cubemap se calcula una vez por mood. Se adjunta a la escena de
   * forma declarativa con <primitive attach="environment">, no mutando
   * el objeto scene.
   */
  const { texture, dispose } = useMemo(() => {
    const dusk = mood === "dusk";
    const top = new THREE.Color(dusk ? SITE.skyTopDusk : SITE.skyTopDay);
    const horizon = new THREE.Color(
      dusk ? SITE.skyHorizonDusk : SITE.skyHorizonDay,
    );
    const groundCol = new THREE.Color(SITE.sidewalk);

    // Escena fuente del cubemap: domo con gradiente + suelo
    const src = new THREE.Scene();

    const domeMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        uTop: { value: top },
        uHorizon: { value: horizon },
        uGround: { value: groundCol },
      },
      vertexShader: /* glsl */ `
        varying vec3 vPos;
        void main() {
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uTop;
        uniform vec3 uHorizon;
        uniform vec3 uGround;
        varying vec3 vPos;
        void main() {
          vec3 d = normalize(vPos);
          float h = d.y;
          vec3 sky = mix(uHorizon, uTop, smoothstep(0.0, 0.85, h));
          // Por debajo del horizonte, el rebote del suelo
          vec3 col = mix(uGround, sky, smoothstep(-0.12, 0.06, h));
          // Disco solar: un highlight en el cubemap para que el vidrio
          // capture un especular creíble sin un HDRI externo.
          vec3 sunDir = normalize(vec3(0.42, 0.72, 0.28));
          float sun = pow(max(0.0, dot(d, sunDir)), 48.0);
          col += vec3(1.0, 0.96, 0.88) * sun * 1.8;
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });

    const dome = new THREE.Mesh(new THREE.SphereGeometry(10, 16, 12), domeMat);
    src.add(dome);

    const pmrem = new THREE.PMREMGenerator(gl);
    pmrem.compileEquirectangularShader();
    const target = pmrem.fromScene(src, 0, 0.1, 30);

    return {
      texture: target.texture,
      dispose: () => {
        target.dispose();
        pmrem.dispose();
        dome.geometry.dispose();
        domeMat.dispose();
      },
    };
  }, [gl, mood]);

  useEffect(() => dispose, [dispose]);

  return <primitive object={texture} attach="environment" />;
}
