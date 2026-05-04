import { useEffect, useRef } from 'react';

export const useGameLoop = (onFrame: (dt: number) => void): void => {
  const rafRef = useRef<number | null>(null);
  const cbRef = useRef(onFrame);

  cbRef.current = onFrame;

  useEffect(() => {
    const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const lowCoreDevice = typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency > 0
      ? navigator.hardwareConcurrency <= 4
      : false;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const targetFps = isCoarsePointer || lowCoreDevice || prefersReducedMotion ? 30 : 60;
    const frameIntervalMs = 1000 / targetFps;
    let last = performance.now();
    let accumulator = 0;

    const handleVisibility = (): void => {
      if (!document.hidden) last = performance.now();
    };

    const loop = (): void => {
      const now = performance.now();
      if (document.hidden) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      const elapsed = now - last;
      if (elapsed <= 0) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      accumulator += elapsed;
      if (accumulator < frameIntervalMs) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      const dt = Math.min(0.1, accumulator / 1000);
      last = now;
      accumulator = 0;
      cbRef.current(dt);
      rafRef.current = requestAnimationFrame(loop);
    };

    document.addEventListener('visibilitychange', handleVisibility);
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);
};
