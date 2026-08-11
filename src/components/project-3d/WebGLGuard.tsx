"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";

type Props = {
  /** Se llama si el contexto se pierde y no se recupera */
  onLost?: () => void;
};

/**
 * Vigila la salud del contexto WebGL.
 *
 * Los navegadores descartan contextos bajo presión de memoria o al cambiar
 * de GPU (portátiles híbridos, suspensión). Sin esto la escena queda negra
 * de forma permanente. Acá se previene el comportamiento por defecto para
 * permitir la restauración, y si no vuelve se avisa para mostrar fallback.
 */
export function WebGLGuard({ onLost }: Props) {
  const { gl, invalidate } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;
    let restoreTimer = 0;

    const handleLost = (event: Event) => {
      // Necesario para que el navegador intente restaurar
      event.preventDefault();
      restoreTimer = window.setTimeout(() => onLost?.(), 2500);
    };

    const handleRestored = () => {
      window.clearTimeout(restoreTimer);
      invalidate();
    };

    canvas.addEventListener("webglcontextlost", handleLost);
    canvas.addEventListener("webglcontextrestored", handleRestored);

    return () => {
      window.clearTimeout(restoreTimer);
      canvas.removeEventListener("webglcontextlost", handleLost);
      canvas.removeEventListener("webglcontextrestored", handleRestored);
    };
  }, [gl, invalidate, onLost]);

  return null;
}
