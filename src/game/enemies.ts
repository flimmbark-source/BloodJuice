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

  if (enemy.moveType === 'chaser') return { x: state.player.x + Math.cos(base + enemy.flankDir * 1.2) * (enemy.trapRange + 28 + Math.abs(slot) * 12), y: state.player.y + Math.sin(base + enemy.flankDir * 1.2) * (enemy.trapRange + 28 + Math.abs(slot) * 12) };
  if (enemy.moveType === 'orbit') return { x: state.player.x + Math.cos(base + (enemy.orbitDir as number) * (1.45 + 0.45 * Math.sin(state.time * 1.7 + enemy.phase)) + slot * 0.14) * (enemy.trapRange + 54), y: state.player.y + Math.sin(base + (enemy.orbitDir as number) * (1.45 + 0.45 * Math.sin(state.time * 1.7 + enemy.phase)) + slot * 0.14) * (enemy.trapRange + 54) };
  if (enemy.moveType === 'zigzag') return { x: state.player.x + Math.cos(laneAng) * (enemy.trapRange + 72 + Math.abs(slot) * 16), y: state.player.y + Math.sin(laneAng) * (enemy.trapRange + 72 + Math.abs(slot) * 16) };
  if (enemy.moveType === 'scout') return { x: state.player.x + Math.cos(laneAng + slot * 0.18) * (enemy.trapRange + 108), y: state.player.y + Math.sin(laneAng + slot * 0.18) * (enemy.trapRange + 108) };
  return { x: state.player.x + Math.cos(backAng) * (enemy.trapRange + 84 + Math.abs(slot) * 14), y: state.player.y + Math.sin(backAng) * (enemy.trapRange + 84 + Math.abs(slot) * 14) };
};

export const stepEnemy = (enemy: Enemy, state: GameState, keys: KeyboardState, dt: number): void => {
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
  } else if (enemy.moveType === 'orbit') {
    angle = goalAngle + (enemy.orbitDir as number) * (gd < 40 ? 1.7 : 0.82);
  } else if (enemy.moveType === 'zigzag') {
    angle = goalAngle + Math.sin(state.time * 4.6 * (enemy.drift as number) + enemy.phase) * 1.05 * (enemy.weaveFlip as number);
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
  }

  enemy.x = clamp(enemy.x + Math.cos(angle) * speed * dt, PLAYER_RADIUS, ARENA_WIDTH - PLAYER_RADIUS);
  enemy.y = clamp(enemy.y + Math.sin(angle) * speed * dt, PLAYER_RADIUS, ARENA_HEIGHT - PLAYER_RADIUS);
};
