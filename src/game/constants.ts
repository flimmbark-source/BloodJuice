export const BASE_ARENA_WIDTH = 960;
export const BASE_ARENA_HEIGHT = 600;
export const BASE_ARENA_ASPECT = BASE_ARENA_WIDTH / BASE_ARENA_HEIGHT;

export let ARENA_WIDTH = BASE_ARENA_WIDTH;
export let ARENA_HEIGHT = BASE_ARENA_HEIGHT;

export const setArenaFromViewport = (displayWidth: number, displayHeight: number): void => {
  const safeWidth = Math.max(1, displayWidth);
  const safeHeight = Math.max(1, displayHeight);
  const aspect = safeWidth / safeHeight;

  if (aspect >= BASE_ARENA_ASPECT) {
    ARENA_HEIGHT = BASE_ARENA_HEIGHT;
    ARENA_WIDTH = Math.min(1600, Math.round(BASE_ARENA_HEIGHT * aspect));
  } else {
    ARENA_WIDTH = BASE_ARENA_WIDTH;
    ARENA_HEIGHT = Math.min(1400, Math.round(BASE_ARENA_WIDTH / aspect));
  }
};
export const PLAYER_RADIUS = 14;
export const DROP_RADIUS = 6;
export const WAVE_BASE = 35;

export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

export const distSq = (a: { x: number; y: number }, b: { x: number; y: number }): number => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
};

export const dist = (a: { x: number; y: number }, b: { x: number; y: number }): number =>
  Math.sqrt(distSq(a, b));

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
