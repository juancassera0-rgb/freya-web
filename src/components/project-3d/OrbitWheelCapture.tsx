"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";

type Props = {
  /** false en táctil: el wheel del trackpad no debe pelear con el scroll. */
  enabled: boolean;
};

/**
 * Dueño del wheel sobre el canvas de OrbitControls.
 *
 * Lenis (y el scroll nativo) escuchan `wheel` en window. OrbitControls
 * también lo escucha en el canvas, pero si el evento no llama
 * `preventDefault` — o Lenis lo consume antes — la página se mueve y el
 * zoom no. Acá se marca el canvas para que Lenis lo ignore
 * (`data-lenis-prevent-wheel`, API oficial) y se bloquea el default con
 * un listener no pasivo. El zoom sigue siendo de OrbitControls.
 *
 * En táctil no se monta el listener: el pinch lo resuelve useSceneTouch
 * y un dedo tiene que poder scrollear la página.
 */
export function OrbitWheelCapture({ enabled }: Props) {
  const gl = useThree((s) => s.gl);

  useEffect(() => {
    const el = gl.domElement;
    if (enabled) {
      el.setAttribute("data-lenis-prevent-wheel", "");
    } else {
      el.removeAttribute("data-lenis-prevent-wheel");
    }

    if (!enabled) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeAttribute("data-lenis-prevent-wheel");
    };
  }, [gl, enabled]);

  return null;
}
