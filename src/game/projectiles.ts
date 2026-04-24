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
  trailPoints: [],
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

const pushTrail = (p: Projectile, cap: number, dt: number): void => {
  if (!p.trailPoints) p.trailPoints = [];
  p.trailPoints.push({ x: p.x, y: p.y, life: 0.22 });
  for (const t of p.trailPoints) t.life -= dt;
  p.trailPoints = p.trailPoints.filter((t) => t.life > 0);
  if (p.trailPoints.length > cap) p.trailPoints.splice(0, p.trailPoints.length - cap);
};

export const stepProjectileTrail = (p: Projectile, dt: number): void => {
  if (p.style === 'needle') pushTrail(p, 8, dt);
  else if (p.style === 'bolt') pushTrail(p, 6, dt);
  else if (p.style === 'bloom') pushTrail(p, 5, dt);
  else if (p.style === 'boomerang') pushTrail(p, 10, dt);
};

export const stepBoomerang = (p: Projectile, enemies: Enemy[], dt: number, boomRate: number): void => {
  const target = enemies.find((e) => e.id === p.tid);
  if (target) {
    p.tx = target.x;
    p.ty = target.y;
  }
  p.life -= dt * boomRate;
  p.spin = (p.spin || 0) + dt * 18;
  const t = 1 - p.life / p.maxLife;
  const split = 0.32;
  let tx = p.x;
  let ty = p.y;
  if (t < split) {
    const u = t / split;
    const cx = p.ox + (p.tx - p.ox) * u;
    const cy = p.oy + (p.ty - p.oy) * u;
    const wob = Math.sin(u * Math.PI) * 26;
    tx = cx + Math.cos(p.baseAngle + u * Math.PI * 0.9 * p.curve) * wob;
    ty = cy + Math.sin(p.baseAngle + u * Math.PI * 0.9 * p.curve) * wob;
  } else {
    if (!p.didBounce) {
      p.didBounce = true;
      p.bx = p.x;
      p.by = p.y;
    }
    const u = (t - split) / (1 - split);
    const overshoot = 0.26 + Math.min(0.28, dist({ x: p.bx, y: p.by }, { x: p.tx, y: p.ty }) / 320);
    const aimX = p.tx + (p.tx - p.bx) * overshoot;
    const aimY = p.ty + (p.ty - p.by) * overshoot;
    const ease = u * u * (3 - 2 * u);
    const lineX = p.bx + (aimX - p.bx) * ease;
    const lineY = p.by + (aimY - p.by) * ease;
    const toTarget = Math.atan2(aimY - p.by, aimX - p.bx);
    const settle = Math.max(0, (u - 0.84) / 0.16);
    const endX = aimX + (p.tx - aimX) * settle;
    const endY = aimY + (p.ty - aimY) * settle;
    const offset = Math.sin(u * Math.PI) * (4.5 * (1 - u));
    tx = lineX + (endX - lineX) * settle + Math.cos(toTarget + Math.PI * 0.5 * p.curve) * offset;
    ty = lineY + (endY - lineY) * settle + Math.sin(toTarget + Math.PI * 0.5 * p.curve) * offset;
  }
  const f = Math.min(1, dt * 15);
  p.x += (tx - p.x) * f;
  p.y += (ty - p.y) * f;
};
