import { ARENA_HEIGHT, ARENA_WIDTH, DROP_RADIUS, PLAYER_RADIUS, clamp, dist, gid, waveLen, xpThreshold } from './constants';
import { canRender, canStabilize, juiceMeta } from './juice';
import { stepEnemy } from './enemies';
import { fireShots, stepBoomerang } from './projectiles';
import { mkSpawnWarning, spawnGroup } from './spawning';
import { enterLevelUpIfNeeded } from './wave';
import type { GameState, KeyboardState, TapMoveState, Upgrade } from './types';

export const dropChance = (state: GameState, elite = false): number => clamp(state.systems.bloodNuggetDropChance + (elite ? 0.18 : 0), 0, 0.9);
export const magnetRange = (state: GameState): number => state.player.magnet + state.player.momentumMagnetBonus * (state.player.momentumEnabled ? state.player.momentumMeter : 0);

export const chooseUpgrade = (state: GameState, upgrade: Upgrade): GameState => {
  if (state.phase !== 'levelup') return state;
  const applied = upgrade.apply(state);
  const wavePicks = applied.wavePicks.includes(upgrade.key) ? applied.wavePicks : [...applied.wavePicks, upgrade.key];
  const resumed: GameState = {
    ...applied,
    wavePicks,
    phase: 'playing',
    offered: [],
    player: { ...applied.player, hp: clamp(applied.player.hp, 0, applied.player.maxHp) },
    messages: [`${upgrade.title} acquired for this wave.`],
  };
  return resumed.pendingLevelUps > 0 ? enterLevelUpIfNeeded(resumed) : resumed;
};

export const synthKeep = (state: GameState, upgrade: Upgrade): GameState => {
  const { cost } = juiceMeta(upgrade);
  if (!canStabilize(state, upgrade.key, cost)) return state;
  return { ...state, juice: state.juice - cost, synthKeep: [...state.synthKeep, upgrade.key] };
};

export const synthBurn = (state: GameState, upgrade: Upgrade): GameState => {
  const { gain } = juiceMeta(upgrade);
  if (!canRender(state, upgrade.key)) return state;
  return { ...state, juice: state.juice + gain, synthBurn: [...state.synthBurn, upgrade.key] };
};

export const stepGame = (
  prev: GameState,
  keys: KeyboardState,
  tapMove: TapMoveState,
  dt: number,
  shotCooldown: number,
): { state: GameState; shotCooldown: number } => {
  if (prev.phase !== 'playing') return { state: prev, shotCooldown };
  const n: GameState = structuredClone(prev);
  n.time += dt;
  n.waveTime = Math.max(0, n.waveTime - dt);
  n.player.hitFlash = Math.max(0, n.player.hitFlash - dt * 4);
  n.player.shield = Math.max(0, n.player.shield - dt * 0.25);
  n.player.pickupHasteTime = Math.max(0, n.player.pickupHasteTime - dt);
  n.systems.funeralHeatTime = Math.max(0, n.systems.funeralHeatTime - dt);
  n.invuln = Math.max(0, n.invuln - dt);

  if (n.waveTime <= 0) {
    return { state: { ...n, phase: 'waveEnd', messages: ['Wave End'], enemies: [], spawns: [], projectiles: [], drops: [] }, shotCooldown: 0 };
  }

  let mx = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0);
  let my = (keys.s || keys.arrowdown ? 1 : 0) - (keys.w || keys.arrowup ? 1 : 0);
  if (mx === 0 && my === 0 && tapMove.active) {
    const dx = tapMove.x - n.player.x;
    const dy = tapMove.y - n.player.y;
    const d = Math.hypot(dx, dy);
    if (d > 6) {
      mx = dx / d;
      my = dy / d;
    }
  }
  const raw = Math.hypot(mx, my);
  const norm = raw || 1;
  n.player.isMoving = raw > 0;
  if (n.player.momentumEnabled) n.player.momentumMeter = clamp(n.player.momentumMeter + (n.player.isMoving ? dt * 0.6 : -dt * 0.9), 0, 1);
  const speedMod = 1 + n.player.pickupHasteTime * n.player.pickupHasteStrength * 0.4;
  n.player.x = clamp(n.player.x + (mx / norm) * n.player.moveSpeed * speedMod * dt, PLAYER_RADIUS, ARENA_WIDTH - PLAYER_RADIUS);
  n.player.y = clamp(n.player.y + (my / norm) * n.player.moveSpeed * speedMod * dt, PLAYER_RADIUS, ARENA_HEIGHT - PLAYER_RADIUS);

  n.spawnBudget += (0.22 + n.time * 0.014 + n.wave * 0.04) * dt;
  n.spawnCooldown -= dt;
  while (n.spawnBudget >= 1 && n.spawnCooldown <= 0) {
    n.spawns.push(...spawnGroup(n.time + n.wave * 12).map(mkSpawnWarning));
    n.spawnBudget -= 1;
    n.spawnCooldown = Math.max(1.25, 3.1 - n.time * 0.003);
  }

  n.spawns.forEach((s) => (s.life -= dt));
  const ready = n.spawns.filter((s) => s.life <= 0);
  n.enemies.push(...ready.map((s) => s.enemy));
  n.spawns = n.spawns.filter((s) => s.life > 0);

  shotCooldown -= dt;
  const fireCd =
    n.player.cooldown /
    ((1 + n.player.momentumMeter * n.player.momentumAttackRate) *
      (1 + n.systems.funeralHeatTime * n.systems.funeralHeatAttackRate) *
      (1 + n.player.pickupHasteTime * n.player.pickupHasteStrength * 0.18));
  if (shotCooldown <= 0) {
    const canFire = !n.player.overdraw || n.player.hp > Math.max(1.1, n.player.overdrawHpCost + 0.15);
    if (canFire) {
      const newShots = fireShots(n.player, n.enemies);
      if (newShots.length > 0) {
        n.projectiles.push(...newShots);
        if (n.player.overdraw) n.player.hp = Math.max(1, n.player.hp - n.player.overdrawHpCost);
        shotCooldown = fireCd;
      } else {
        shotCooldown = 0.08;
      }
    }
  }

  n.projectiles.forEach((p) => {
    p.px = p.x;
    p.py = p.y;
    if (p.style === 'boomerang') stepBoomerang(p, n.enemies, dt, n.player.boomRate || 1);
    else {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
  });
  n.projectiles = n.projectiles.filter((p) => p.life > 0);

  n.enemies.forEach((e) => stepEnemy(e, n, keys, dt));

  n.projectiles.forEach((p) => {
    for (const e of n.enemies) {
      if (!p.hitIds.includes(e.id) && dist(p, e) <= e.r + 4) {
        if (p.style === 'boomerang' && p.dotDps > 0) {
          e.dotDps = Math.max(e.dotDps || 0, p.dotDps);
          e.dotTime = Math.max(e.dotTime || 0, p.dotTime);
        } else {
          e.hp -= p.damage;
        }
        p.hitIds.push(e.id);
        if (n.player.leechOnHit > 0) n.player.hp = Math.min(n.player.maxHp, n.player.hp + n.player.leechOnHit);
        if (p.pierceLeft > 0) p.pierceLeft -= 1;
        else p.life = 0;
        break;
      }
    }
  });

  const survivors = [];
  for (const e of n.enemies) {
    if (e.hp <= 0) {
      n.kills += 1;
      n.drops.push({ id: gid(), x: e.x, y: e.y, value: e.elite ? 3 : 1, type: 'xp' });
      if (Math.random() < dropChance(n, e.elite)) n.drops.push({ id: gid(), x: e.x, y: e.y, value: n.systems.bloodNuggetHeal, type: 'heal' });
    } else survivors.push(e);
  }
  n.enemies = survivors;

  const magnet = magnetRange(n);
  n.drops.forEach((d) => {
    const dd = dist(d, n.player);
    if (dd < magnet) {
      const a = Math.atan2(n.player.y - d.y, n.player.x - d.x);
      const sp = 240 + (magnet - dd) * 4;
      d.x += Math.cos(a) * sp * dt;
      d.y += Math.sin(a) * sp * dt;
    }
  });
  n.drops = n.drops.filter((d) => {
    if (dist(d, n.player) >= PLAYER_RADIUS + DROP_RADIUS + 2) return true;
    if (d.type === 'xp') {
      n.xp += d.value;
      if (n.player.harvestLineEnabled) n.player.pickupHasteTime = clamp(n.player.pickupHasteTime + 0.45, 0, 2.5);
    } else {
      const missing = n.player.maxHp - n.player.hp;
      const heal = Math.min(d.value, Math.max(0, missing));
      n.player.hp += heal;
      const left = d.value - heal;
      if (left > 0 && n.player.overhealShield) n.player.shield += left;
    }
    return false;
  });

  while (n.xp >= n.xpTarget) {
    n.xp -= n.xpTarget;
    n.level += 1;
    n.pendingLevelUps += 1;
    n.xpTarget = xpThreshold(n.level);
  }

  if (n.pendingLevelUps > 0) return { state: enterLevelUpIfNeeded(n), shotCooldown };

  for (const e of n.enemies) {
    if (dist(e, n.player) < e.r + PLAYER_RADIUS && n.invuln <= 0) {
      let damage = e.damage;
      if (n.player.shield > 0) {
        const absorbed = Math.min(n.player.shield, damage);
        n.player.shield -= absorbed;
        damage -= absorbed;
      }
      n.player.hp -= damage;
      n.player.hitFlash = 1;
      n.invuln = 0.5;
      if (n.player.hp <= 0) return { state: { ...n, phase: 'dead', messages: ['The bloom overwhelmed you.'] }, shotCooldown };
    }
  }

  return { state: n, shotCooldown };
};

export const prepareWaveEndToSynthesis = (state: GameState): GameState => {
  if (state.phase !== 'waveEnd') return state;
  return { ...state, phase: 'synthesis', messages: ['Choose what survives the synthesis.'], synthKeep: [], synthBurn: [] };
};

export const resetForNewRun = (state: GameState): GameState => ({ ...state, phase: 'start', wave: 1, waveTime: waveLen(1) });
