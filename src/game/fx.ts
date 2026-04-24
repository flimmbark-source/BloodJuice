import { gid, rand } from './constants';
import type { Particle, Ripple } from './types';

export const makeParticle = (
  x: number,
  y: number,
  vx: number,
  vy: number,
  color: string,
  life: number,
  size: number,
  drag = 3,
): Particle => ({ id: gid(), x, y, vx, vy, color, life, maxLife: life, size, drag });

export const sparkBurst = (
  x: number,
  y: number,
  color: string,
  count = 6,
  speed = 140,
  life: [number, number] = [0.2, 0.38],
  size = 1.8,
): Particle[] => {
  const out: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const a = rand(0, Math.PI * 2);
    const s = rand(speed * 0.45, speed);
    const l = rand(life[0], life[1]);
    out.push(makeParticle(x, y, Math.cos(a) * s, Math.sin(a) * s, color, l, size * rand(0.75, 1.3), 3.4));
  }
  return out;
};

export const directionalSparks = (
  x: number,
  y: number,
  angle: number,
  color: string,
  count = 4,
  speed = 180,
  spread = 0.9,
  life: [number, number] = [0.18, 0.3],
  size = 1.7,
): Particle[] => {
  const out: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const a = angle + rand(-spread, spread);
    const s = rand(speed * 0.5, speed);
    const l = rand(life[0], life[1]);
    out.push(makeParticle(x, y, Math.cos(a) * s, Math.sin(a) * s, color, l, size * rand(0.8, 1.2), 4));
  }
  return out;
};

export const ripple = (
  x: number,
  y: number,
  maxR: number,
  color: string,
  life = 0.28,
  width = 2,
): Ripple => ({ id: gid(), x, y, r: Math.min(maxR * 0.25, 6), maxR, life, maxLife: life, color, width });

export const stepParticles = (arr: Particle[], dt: number): Particle[] => {
  for (const p of arr) {
    const d = 1 - Math.min(1, (p.drag ?? 3) * dt);
    p.vx *= d;
    p.vy *= d;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
  }
  return arr.filter((p) => p.life > 0);
};

export const stepRipples = (arr: Ripple[], dt: number): Ripple[] => {
  for (const r of arr) {
    r.life -= dt;
    const t = 1 - Math.max(0, r.life / r.maxLife);
    r.r = Math.min(r.maxR, r.maxR * (0.25 + t * 0.9));
  }
  return arr.filter((r) => r.life > 0);
};
