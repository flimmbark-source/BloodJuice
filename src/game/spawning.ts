import { ARENA_HEIGHT, ARENA_WIDTH, clamp, dist, gid, rand } from './constants';
import type { Enemy, SpawnWarning } from './types';

const spawnAnchor = (): { x: number; y: number; side: number } => {
  const side = Math.floor(Math.random() * 4);
  const margin = 34;
  const padding = 70;
  if (side === 0) return { x: rand(padding, ARENA_WIDTH - padding), y: margin, side };
  if (side === 1) return { x: ARENA_WIDTH - margin, y: rand(padding, ARENA_HEIGHT - padding), side };
  if (side === 2) return { x: rand(padding, ARENA_WIDTH - padding), y: ARENA_HEIGHT - margin, side };
  return { x: margin, y: rand(padding, ARENA_HEIGHT - padding), side };
};

const groupOffset = (i: number, total: number, side: number): { x: number; y: number; slot: number } => {
  const slot = i - (total - 1) / 2;
  const spread = 24;
  const jitter = 8;
  const along = slot * spread + rand(-jitter, jitter);
  const deep = rand(-6, 18);
  const horizontal = side === 0 || side === 2;
  return {
    x: horizontal ? along : side === 1 ? -deep : deep,
    y: horizontal ? (side === 0 ? deep : -deep) : along,
    slot,
  };
};

const spawnType = (t = 0): Enemy['moveType'] => {
  const types = t < 20 ? ['chaser', 'orbit', 'zigzag'] : t < 70 ? ['chaser', 'orbit', 'zigzag', 'scout'] : ['chaser', 'orbit', 'zigzag', 'scout', 'tank'];
  return types[Math.floor(Math.random() * types.length)] as Enemy['moveType'];
};

const mkEnemy = (x: number, y: number, t = 0, kind: Enemy['moveType'] = 'chaser', slot = 0): Enemy => {
  const elite = Math.random() < Math.min(0.08, 0.015 + t / 500);
  const base: Enemy = {
    id: gid(),
    x,
    y,
    r: elite ? 15 : 11,
    hp: elite ? 10 + t * 0.08 : 4 + t * 0.035,
    maxHp: elite ? 10 + t * 0.08 : 4 + t * 0.035,
    speed: elite ? 48 : 65,
    damage: elite ? 2 : 1,
    color: elite ? '#f97316' : '#c084fc',
    elite,
    moveType: kind,
    flankDir: Math.random() < 0.5 ? -1 : 1,
    packSlot: slot,
    laneBias: rand(0.75, 1.25),
    trapRange: elite ? 44 : 34,
    phase: rand(0, Math.PI * 2),
    dotTime: 0,
    dotDps: 0,
  };
  if (kind === 'chaser') return { ...base, color: elite ? '#fb923c' : '#f472b6', speed: elite ? 60 : 82, burstCd: rand(1.2, 2.2), burstTime: 0 };
  if (kind === 'orbit') return { ...base, color: elite ? '#a78bfa' : '#818cf8', speed: elite ? 54 : 72, orbitDir: Math.random() < 0.5 ? -1 : 1, feintCd: rand(1.2, 2.2), feintTime: 0 };
  if (kind === 'zigzag') return { ...base, color: elite ? '#38bdf8' : '#22d3ee', speed: elite ? 72 : 92, drift: rand(0.75, 1.35), weaveFlip: Math.random() < 0.5 ? -1 : 1 };
  if (kind === 'scout') return { ...base, color: elite ? '#facc15' : '#bef264', r: elite ? 12 : 9, hp: elite ? 7 + t * 0.05 : 3 + t * 0.025, maxHp: elite ? 7 + t * 0.05 : 3 + t * 0.025, speed: elite ? 92 : 118, dashCd: rand(0.45, 1), dashTime: 0, dashAngle: 0 };
  return { ...base, color: elite ? '#f87171' : '#94a3b8', r: elite ? 19 : 16, hp: elite ? 18 + t * 0.12 : 9 + t * 0.065, maxHp: elite ? 18 + t * 0.12 : 9 + t * 0.065, speed: elite ? 35 : 42, damage: elite ? 3 : 2, slamCd: rand(1.8, 3), slamTime: 0, windup: 0, chargeTime: 0, chargeAngle: 0 };
};

export const spawnEnemy = (t = 0, slot = 0, total = 1, anchor = spawnAnchor()): Enemy => {
  const o = groupOffset(slot, total, anchor.side);
  return mkEnemy(clamp(anchor.x + o.x, 20, ARENA_WIDTH - 20), clamp(anchor.y + o.y, 20, ARENA_HEIGHT - 20), t, spawnType(t), o.slot);
};

export const spawnGroup = (t = 0): Enemy[] => {
  const count = t < 35 ? 2 : t < 100 ? 3 : Math.min(5, 3 + Math.floor((t - 100) / 90));
  const anchor = spawnAnchor();
  return Array.from({ length: count }, (_, i) => spawnEnemy(t, i, count, anchor));
};

export const mkSpawnWarning = (enemy: Enemy): SpawnWarning => ({ id: gid(), x: enemy.x, y: enemy.y, r: enemy.r + 10, life: 0.55, maxLife: 0.55, enemy });

export const groupedSpawnSpread = (group: Enemy[]): number => {
  if (group.length < 2) return 0;
  return Math.max(...group.map((a) => Math.max(...group.map((b) => dist(a, b)))));
};
