import { ARENA_HEIGHT, ARENA_WIDTH, PLAYER_RADIUS, clamp, dist, rand } from './constants';
import type { Enemy, GameState, KeyboardState } from './types';

const enemyGoal = (enemy: Enemy, state: GameState, keys: KeyboardState): { x: number; y: number } => {
  const mvx = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0);
  const mvy = (keys.s || keys.arrowdown ? 1 : 0) - (keys.w || keys.arrowup ? 1 : 0);
  const hasMove = mvx || mvy;
  const pdx = state.player.x - enemy.x;
  const pdy = state.player.y - enemy.y;
  const base = Math.atan2(pdy, pdx);
  const d = Math.hypot(pdx, pdy);
  const moveAng = hasMove ? Math.atan2(mvy, mvx) : base + Math.PI;
  const slot = enemy.packSlot || 0;
  const laneAng = moveAng + enemy.flankDir * (1.05 * enemy.laneBias);
  const backAng = moveAng + Math.PI + slot * 0.22;
  const sideAng = base + enemy.flankDir * (1.2 + Math.min(0.6, d / 260));

  if (enemy.moveType === 'chaser') return { x: state.player.x + Math.cos(sideAng) * (enemy.trapRange + 28 + Math.abs(slot) * 12), y: state.player.y + Math.sin(sideAng) * (enemy.trapRange + 28 + Math.abs(slot) * 12) };
  if (enemy.moveType === 'orbit') {
    const ring = base + (enemy.orbitDir as number) * (1.45 + 0.45 * Math.sin(state.time * 1.7 + enemy.phase)) + slot * 0.14;
    return { x: state.player.x + Math.cos(ring) * (enemy.trapRange + 54), y: state.player.y + Math.sin(ring) * (enemy.trapRange + 54) };
  }
  if (enemy.moveType === 'zigzag') return { x: state.player.x + Math.cos(laneAng) * (enemy.trapRange + 72 + Math.abs(slot) * 16), y: state.player.y + Math.sin(laneAng) * (enemy.trapRange + 72 + Math.abs(slot) * 16) };
  if (enemy.moveType === 'scout') return { x: state.player.x + Math.cos(laneAng + slot * 0.18) * (enemy.trapRange + 108), y: state.player.y + Math.sin(laneAng + slot * 0.18) * (enemy.trapRange + 108) };
  return { x: state.player.x + Math.cos(backAng) * (enemy.trapRange + 84 + Math.abs(slot) * 14), y: state.player.y + Math.sin(backAng) * (enemy.trapRange + 84 + Math.abs(slot) * 14) };
};

export const stepEnemy = (enemy: Enemy, state: GameState, keys: KeyboardState, dt: number): void => {
  const prevX = enemy.x;
  const prevY = enemy.y;
  if (typeof enemy.hurtFlash === 'number' && enemy.hurtFlash > 0) {
    enemy.hurtFlash = Math.max(0, (enemy.hurtFlash as number) - dt * 5);
  }
  if (enemy.dotTime > 0 && enemy.dotDps > 0) {
    enemy.hp -= enemy.dotDps * dt;
    enemy.dotTime = Math.max(0, enemy.dotTime - dt);
  }

  const g = enemyGoal(enemy, state, keys);
  const goalAngle = Math.atan2(g.y - enemy.y, g.x - enemy.x);
  const gd = dist(g, enemy);
  let angle = goalAngle;
  let speed = enemy.speed;

  if (enemy.moveType === 'chaser') {
    enemy.burstCd = (enemy.burstCd as number) - dt;
    if ((enemy.burstTime as number) > 0) {
      enemy.burstTime = (enemy.burstTime as number) - dt;
      speed *= 2.1;
      angle = goalAngle + enemy.flankDir * 0.15;
    } else if ((enemy.burstCd as number) <= 0 && gd > 70 && gd < 220) {
      enemy.burstCd = rand(2, 3.4);
      enemy.burstTime = 0.28;
    }
    speed *= gd < 56 ? 1.18 : 1.02;
  } else if (enemy.moveType === 'orbit') {
    enemy.feintCd = (enemy.feintCd as number) - dt;
    if ((enemy.feintTime as number) > 0) {
      enemy.feintTime = (enemy.feintTime as number) - dt;
      angle = goalAngle - (enemy.orbitDir as number) * 1.3;
      speed *= 1.65;
    } else {
      angle = goalAngle + (enemy.orbitDir as number) * (gd < 40 ? 1.7 : 0.82);
      speed *= gd < 52 ? 0.62 : 1.16;
      if ((enemy.feintCd as number) <= 0 && gd < 170) {
        enemy.feintCd = rand(1.6, 2.6);
        enemy.feintTime = 0.22;
      }
    }
  } else if (enemy.moveType === 'zigzag') {
    const wave = Math.sin(state.time * 4.6 * (enemy.drift as number) + enemy.phase) * 1.05;
    angle = goalAngle + wave * (enemy.weaveFlip as number);
    speed *= 1.28;
    if (Math.sin(state.time * 1.7 + enemy.phase) > 0.985) enemy.weaveFlip = -(enemy.weaveFlip as number);
  } else if (enemy.moveType === 'scout') {
    enemy.dashCd = (enemy.dashCd as number) - dt;
    if ((enemy.dashTime as number) > 0) {
      enemy.dashTime = (enemy.dashTime as number) - dt;
      angle = enemy.dashAngle as number;
      speed *= 3.8;
    } else if ((enemy.dashCd as number) <= 0) {
      enemy.dashCd = rand(0.7, 1.15);
      enemy.dashTime = 0.24;
      enemy.dashAngle = goalAngle + enemy.flankDir * 1.15;
    }
  } else if (enemy.moveType === 'tank') {
    enemy.slamCd = (enemy.slamCd as number) - dt;
    if ((enemy.chargeTime as number) > 0) {
      enemy.chargeTime = (enemy.chargeTime as number) - dt;
      angle = enemy.chargeAngle as number;
      speed *= 4.4;
    } else if ((enemy.windup as number) > 0) {
      enemy.windup = (enemy.windup as number) - dt;
      speed *= 0.1;
      if ((enemy.windup as number) <= 0) {
        enemy.chargeTime = 0.48;
        enemy.chargeAngle = goalAngle;
      }
    } else if ((enemy.slamTime as number) > 0) {
      enemy.slamTime = (enemy.slamTime as number) - dt;
      angle = goalAngle + enemy.flankDir * 1.35;
      speed *= 0.55;
    } else if (gd < 190) {
      enemy.windup = rand(0.34, 0.56);
      enemy.slamCd = rand(2.5, 4);
      enemy.slamTime = 0.26;
      speed *= 0.22;
    } else {
      speed *= 0.9;
    }
  }

  enemy.x = clamp(enemy.x + Math.cos(angle) * speed * dt, PLAYER_RADIUS, ARENA_WIDTH - PLAYER_RADIUS);
  enemy.y = clamp(enemy.y + Math.sin(angle) * speed * dt, PLAYER_RADIUS, ARENA_HEIGHT - PLAYER_RADIUS);
  enemy.vx = (enemy.x - prevX) / Math.max(dt, 1e-5);
  enemy.vy = (enemy.y - prevY) / Math.max(dt, 1e-5);
};
