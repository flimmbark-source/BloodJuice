import { useEffect, useRef } from 'react';

export const useGameLoop = (onFrame: (dt: number) => void): void => {
  const rafRef = useRef<number | null>(null);
  const cbRef = useRef(onFrame);

  cbRef.current = onFrame;

  useEffect(() => {
    let last = performance.now();
    const loop = (): void => {
      const now = performance.now();
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      cbRef.current(dt);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);
};
