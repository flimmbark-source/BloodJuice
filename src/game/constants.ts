export const ARENA_WIDTH = 960;
export const ARENA_HEIGHT = 600;
export const PLAYER_RADIUS = 14;
export const DROP_RADIUS = 6;
export const WAVE_BASE = 35;

export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

export const dist = (a: { x: number; y: number }, b: { x: number; y: number }): number =>
  Math.hypot(a.x - b.x, a.y - b.y);

export const rand = (min: number, max: number): number => Math.random() * (max - min) + min;

let gidCounter = 0;
export const gid = (): string => `${Date.now()}-${gidCounter++}`;

export const formatTimer = (seconds: number): string => {
  const safe = Math.max(0, seconds);
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(Math.ceil(safe % 60)).padStart(2, '0')}`;
};

export const waveLen = (wave: number): number => Math.max(24, WAVE_BASE + Math.min(18, wave * 3));

export const xpThreshold = (level: number): number =>
  Math.max(2, Math.floor((10 + level * 7 + level * level * 1.35) * 0.25));
