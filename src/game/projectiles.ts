import { dist, gid } from './constants';
import type { Enemy, PlayerState, Projectile } from './types';

const momentumMeter = (p: PlayerState): number => (p.momentumEnabled ? p.momentumMeter || 0 : 0);
const missingHpDamageBonus = (p: PlayerState): number =>
  p.missingHpDamageScale ? ((p.maxHp - p.hp) / Math.max(1, p.maxHp)) * p.missingHpDamageScale : 0;

export const makeProjectile = (
  p: PlayerState,
  t: Enemy,
  angle: number,
  speed: number,
  multiplier: number,
  movingPierce: number,
  index: number,
): Projectile => ({
  id: gid(),
  x: p.x,
  y: p.y,
  px: p.x,
  py: p.y,
  ox: p.x,
  oy: p.y,
  tid: t.id,
  tx: t.x,
  ty: t.y,
  bx: p.x,
  by: p.y,
  didBounce: false,
  vx: Math.cos(angle) * speed,
  vy: Math.sin(angle) * speed,
  life: (p.range || 320) / speed,
  maxLife: (p.range || 320) / speed,
  damage: Math.max(0, p.damage * multiplier),
  dotDps: (p.boomDot || 0) * multiplier,
  dotTime: p.boomDotTime || 0,
  pierceLeft: p.pierce + movingPierce,
  size: p.shotSize || 4,
  color: p.shotColor || '#f8fafc',
  style: p.shotStyle || 'bolt',
  hitIds: [],
  curve: index % 2 === 0 ? 1 : -1,
  baseAngle: angle,
  spin: 0,
});

export const fireShots = (player: PlayerState, enemies: Enemy[]): Projectile[] => {
  const range = player.range || 320;
  if (!enemies.length) return [];
  const inRange = enemies.filter((e) => dist(player, e) <= range);
  if (!inRange.length) return [];

  const target = [...inRange].sort((a, b) => dist(player, a) - dist(player, b))[0];
  const baseAngle = Math.atan2(target.y - player.y, target.x - player.x);
  const spread = player.projectiles === 1 ? 0 : player.weaponSpread || 0.22;
  const multiplier =
    1 +
    missingHpDamageBonus(player) +
    momentumMeter(player) * (player.momentumDamage || 0) +
    (player.pickupHasteTime || 0) * (player.pickupHasteStrength || 0) * 0.35 +
    (player.isMoving ? player.movingDamageBonus || 0 : 0);
  const movingPierce = player.isMoving ? player.movingPierceBonus : 0;
  const speed = player.shotSpeed || 520;

  return Array.from({ length: player.projectiles }, (_, i) =>
    makeProjectile(player, target, baseAngle + (i - (player.projectiles - 1) / 2) * spread, speed, multiplier, movingPierce, i),
  );
};

export const stepBoomerang = (p: Projectile, enemies: Enemy[], dt: number, boomRate: number): void => {
  const target = enemies.find((e) => e.id === p.tid);
  if (target) {
    p.tx = target.x;
    p.ty = target.y;
  }
  p.life -= dt * boomRate;
  p.x += (p.tx - p.x) * Math.min(1, dt * 8);
  p.y += (p.ty - p.y) * Math.min(1, dt * 8);
};
