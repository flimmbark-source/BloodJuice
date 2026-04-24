import { useEffect, useRef } from 'react';

export const useGameLoop = (onFrame: (dt: number) => void): void => {
  const rafRef = useRef<number | null>(null);
  const cbRef = useRef(onFrame);

  cbRef.current = onFrame;

  useEffect(() => {
    const isMobile = window.matchMedia('(pointer: coarse)').matches;
    const frameIntervalMs = isMobile ? 1000 / 45 : 1000 / 60;
    let last = performance.now();

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
      if (elapsed < frameIntervalMs) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      const dt = Math.min(0.033, elapsed / 1000);
      last = now;
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
