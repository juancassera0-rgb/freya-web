"use client";

import { AnimatedCounter } from "./AnimatedCounter";

type Props = {
  step: number;
  className?: string;
};

export function StepCounter({ step, className }: Props) {
  const prefix = step < 10 ? "0" : "";
  return (
    <span className={className}>
      {prefix}
      <AnimatedCounter value={step} durationMs={900 + step * 200} />
    </span>
  );
}
