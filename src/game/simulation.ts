import { ARENA_HEIGHT, ARENA_WIDTH, DROP_RADIUS, PLAYER_RADIUS, clamp, dist, distSq, gid, rand, waveLen, xpThreshold } from './constants';
import { canRender, canStabilize, juiceMeta } from './juice';
import { stepEnemy } from './enemies';
import { fireShots, stepBoomerang, stepProjectileTrail } from './projectiles';
import { mkSpawnWarning, spawnGroup } from './spawning';
import { enterLevelUpIfNeeded } from './wave';
import { directionalSparks, ripple as mkRipple, sparkBurst, stepParticles, stepRipples } from './fx';
import type { AreaZone, Enemy, GameState, KeyboardState, Projectile, TapMoveState, Upgrade } from './types';

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

const ashZone = (x: number, y: number, state: GameState): AreaZone => ({
  id: gid(),
  x,
  y,
  radius: Math.max(18, state.systems.corpseExplosionRadius * 0.85),
  life: state.systems.ashWakeDuration || 0.7,
});

const hitFx = (n: GameState, p: Projectile, e: Enemy): void => {
  const angle = Math.atan2(p.vy || e.y - p.py, p.vx || e.x - p.px);
  n.particles.push(...directionalSparks(e.x, e.y, angle + Math.PI, p.color, p.style === 'needle' ? 3 : 4, p.style === 'needle' ? 220 : 150));
  n.ripples.push(mkRipple(e.x, e.y, p.style === 'bloom' ? 18 : 14, p.color, p.style === 'needle' ? 0.18 : 0.22, p.style === 'bloom' ? 2.2 : 1.8));
  e.hurtFlash = 1;
};

const dotMarkFx = (n: GameState, p: Projectile, e: Enemy): void => {
  n.ripples.push(mkRipple(e.x, e.y, e.r + 14, 'rgba(134,239,172,.9)', 0.32, 2));
  n.particles.push(...directionalSparks(e.x, e.y, Math.atan2(e.y - p.y, e.x - p.x), '#86efac', 5, 160, 1.2, [0.2, 0.36], 1.6));
  e.hurtFlash = 1;
};

const killFx = (n: GameState, e: Enemy): void => {
  const color = e.elite ? '#fde68a' : e.color;
  n.particles.push(...sparkBurst(e.x, e.y, color, e.elite ? 14 : 9, e.elite ? 220 : 170, [0.28, 0.5], e.elite ? 2.4 : 2));
  n.ripples.push(mkRipple(e.x, e.y, e.r + (e.elite ? 28 : 20), color, 0.32, 2));
};

const explosionKillFx = (n: GameState, e: Enemy): void => {
  n.particles.push(...sparkBurst(e.x, e.y, '#fcd34d', 12, 240, [0.3, 0.55], 2.2));
  n.particles.push(...sparkBurst(e.x, e.y, '#fb923c', 6, 120, [0.4, 0.7], 1.6));
  n.ripples.push(mkRipple(e.x, e.y, e.r + 26, '#fde68a', 0.4, 2.4));
};

const pickupFx = (n: GameState, x: number, y: number, kind: 'xp' | 'heal', value: number): void => {
  const color = kind === 'heal' ? '#fb7185' : value > 1 ? '#f59e0b' : '#34d399';
  n.particles.push(...sparkBurst(x, y, color, 6, 140, [0.22, 0.4], 1.6));
  n.ripples.push(mkRipple(x, y, 22, color, 0.3, 2));
};

const maybeAddTrailZone = (n: GameState, dt: number, ctx: { lastPush: number }): void => {
  if (!n.player.trailEnabled || !n.player.isMoving) return;
  ctx.lastPush -= dt;
  if (ctx.lastPush > 0) return;
  n.trail.push({ id: gid(), x: n.player.x, y: n.player.y, radius: 14, life: 0.45 });
  ctx.lastPush = 0.12;
};

export const stepGame = (
  prev: GameState,
  keys: KeyboardState,
  tapMove: TapMoveState,
  dt: number,
  shotCooldown: number,
): { state: GameState; shotCooldown: number } => {
  if (prev.phase !== 'playing') return { state: prev, shotCooldown };
  if (prev.hitStop > 0) {
    return {
      state: { ...prev, hitStop: Math.max(0, prev.hitStop - dt) },
      shotCooldown,
    };
  }
  const n: GameState = structuredClone(prev);
  n.time += dt;
  n.shake = Math.max(0, n.shake - dt * 18);
  n.waveTime = Math.max(0, n.waveTime - dt);
  n.player.hitFlash = Math.max(0, n.player.hitFlash - dt * 4);
  n.player.shield = Math.max(0, n.player.shield - dt * 0.25);
  n.player.pickupHasteTime = Math.max(0, n.player.pickupHasteTime - dt);
  n.systems.funeralHeatTime = Math.max(0, n.systems.funeralHeatTime - dt);
  n.invuln = Math.max(0, n.invuln - dt);

  if (n.waveTime <= 0) {
    return { state: { ...n, phase: 'waveEnd', messages: ['Wave End'], enemies: [], spawns: [], projectiles: [], drops: [], particles: [], ripples: [] }, shotCooldown: 0 };
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

  const trailCtx = { lastPush: (prev as GameState & { _trailCd?: number })._trailCd ?? 0 };
  maybeAddTrailZone(n, dt, trailCtx);
  (n as GameState & { _trailCd?: number })._trailCd = trailCtx.lastPush;

  n.trail.forEach((z) => (z.life -= dt));
  n.trail = n.trail.filter((z) => z.life > 0);
  n.ash.forEach((z) => (z.life -= dt));
  n.ash = n.ash.filter((z) => z.life > 0);
  n.expl.forEach((z) => (z.life -= dt));
  n.expl = n.expl.filter((z) => z.life > 0);
  n.floaters.forEach((f) => {
    f.life -= dt;
    f.y -= f.vy * dt;
  });
  n.floaters = n.floaters.filter((f) => f.life > 0);
  n.particles = stepParticles(n.particles, dt);
  n.ripples = stepRipples(n.ripples, dt);

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
  for (const s of ready) n.ripples.push(mkRipple(s.x, s.y, s.r + 14, 'rgba(248,113,113,.9)', 0.36, 2));
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
    stepProjectileTrail(p, dt);
  });
  n.projectiles = n.projectiles.filter((p) => p.life > 0 && p.x > -40 && p.x < ARENA_WIDTH + 40 && p.y > -40 && p.y < ARENA_HEIGHT + 40);

  n.enemies.forEach((e) => stepEnemy(e, n, keys, dt));

  if (n.player.trailEnabled) {
    for (const z of n.trail) {
      for (const e of n.enemies) {
        const rr = z.radius + e.r;
        if (distSq(z, e) <= rr * rr) e.hp -= n.player.trailDamagePerSecond * dt;
      }
    }
  }
  if (n.systems.ashWakeEnabled) {
    for (const z of n.ash) {
      for (const e of n.enemies) {
        const rr = z.radius + e.r;
        if (distSq(z, e) <= rr * rr) e.hp -= n.systems.ashWakeDps * dt;
      }
    }
  }

  n.projectiles.forEach((p) => {
    for (const e of n.enemies) {
      if (!p.hitIds.includes(e.id) && distSq(p, e) <= (e.r + p.size) * (e.r + p.size)) {
        if (p.style === 'boomerang' && p.dotDps > 0) {
          e.dotDps = Math.max(e.dotDps || 0, p.dotDps);
          e.dotTime = Math.max(e.dotTime || 0, p.dotTime);
          n.floaters.push({ id: gid(), x: e.x + rand(-6, 6), y: e.y - 6, text: `${Math.round(p.dotDps * 10) / 10}/s`, color: p.color, life: 0.55, vy: 18 });
          dotMarkFx(n, p, e);
        } else {
          e.hp -= p.damage;
          n.floaters.push({ id: gid(), x: e.x + rand(-6, 6), y: e.y - 6, text: `-${Math.round(p.damage * 10) / 10}`, color: p.color, life: 0.55, vy: 18 });
          hitFx(n, p, e);
        }
        p.hitIds.push(e.id);
        if (n.player.leechOnHit > 0) n.player.hp = Math.min(n.player.maxHp, n.player.hp + n.player.leechOnHit);
        if (p.pierceLeft > 0) p.pierceLeft -= 1;
        else p.life = 0;
        break;
      }
    }
  });

  const survivors: Enemy[] = [];
  const explosionPoints: { x: number; y: number }[] = [];
  for (const e of n.enemies) {
    if (e.hp <= 0) {
      n.kills += 1;
      n.drops.push({ id: gid(), x: e.x, y: e.y, value: e.elite ? 3 : 1, type: 'xp' });
      if (Math.random() < dropChance(n, e.elite)) n.drops.push({ id: gid(), x: e.x + rand(-8, 8), y: e.y + rand(-8, 8), value: n.systems.bloodNuggetHeal, type: 'heal' });
      killFx(n, e);
      if (n.systems.corpseExplosionRadius > 0) explosionPoints.push({ x: e.x, y: e.y });
    } else survivors.push(e);
  }
  n.enemies = survivors;

  let chainKills = 0;
  if (explosionPoints.length) {
    for (const pt of explosionPoints) {
      n.expl.push({ id: gid(), x: pt.x, y: pt.y, r: n.systems.corpseExplosionRadius, life: 0.22 });
      n.ripples.push(mkRipple(pt.x, pt.y, n.systems.corpseExplosionRadius + 4, '#fde68a', 0.34, 2.4));
      n.particles.push(...sparkBurst(pt.x, pt.y, '#fbbf24', 10, 220, [0.28, 0.5], 2));
      n.enemies.forEach((e) => {
        if (distSq(pt, e) <= (n.systems.corpseExplosionRadius + e.r) * (n.systems.corpseExplosionRadius + e.r)) {
          e.hp -= n.systems.corpseExplosionDamage;
          e.hurtFlash = 1;
        }
      });
      if (n.systems.ashWakeEnabled) n.ash.push(ashZone(pt.x, pt.y, n));
    }
    const post: Enemy[] = [];
    for (const e of n.enemies) {
      if (e.hp <= 0) {
        chainKills += 1;
        n.kills += 1;
        n.drops.push({ id: gid(), x: e.x, y: e.y, value: 1 + n.systems.chainXpBonus, type: 'xp' });
        if (Math.random() < dropChance(n, e.elite)) n.drops.push({ id: gid(), x: e.x + rand(-8, 8), y: e.y + rand(-8, 8), value: n.systems.bloodNuggetHeal, type: 'heal' });
        explosionKillFx(n, e);
      } else post.push(e);
    }
    n.enemies = post;
  }
  if (chainKills > 0 && n.systems.funeralHeatEnabled) n.systems.funeralHeatTime = clamp(n.systems.funeralHeatTime + 0.8, 0, 1.4);
  if (chainKills > 0) {
    n.hitStop = Math.max(n.hitStop, Math.min(0.06, 0.04 + chainKills * 0.008));
    n.shake = Math.max(n.shake, Math.min(3.5, 2 + chainKills * 0.35));
  }

  const magnet = magnetRange(n);
  n.drops.forEach((d) => {
    const ddSq = distSq(d, n.player);
    if (ddSq < magnet * magnet) {
      const dd = Math.sqrt(ddSq);
      const a = Math.atan2(n.player.y - d.y, n.player.x - d.x);
      const sp = 240 + (magnet - dd) * 4;
      d.x += Math.cos(a) * sp * dt;
      d.y += Math.sin(a) * sp * dt;
    }
  });
  n.drops = n.drops.filter((d) => {
    if (distSq(d, n.player) >= (PLAYER_RADIUS + DROP_RADIUS + 2) * (PLAYER_RADIUS + DROP_RADIUS + 2)) return true;
    if (d.type === 'xp') {
      n.xp += d.value;
      n.floaters.push({ id: gid(), x: n.player.x + rand(-10, 10), y: n.player.y - 18, text: `+${d.value} XP`, color: '#34d399', life: 0.6, vy: 20 });
      pickupFx(n, d.x, d.y, 'xp', d.value);
      if (n.player.harvestLineEnabled) n.player.pickupHasteTime = clamp(n.player.pickupHasteTime + 0.45, 0, 2.5);
    } else {
      const missing = n.player.maxHp - n.player.hp;
      const heal = Math.min(d.value, Math.max(0, missing));
      n.player.hp += heal;
      if (heal > 0) n.floaters.push({ id: gid(), x: n.player.x + rand(-10, 10), y: n.player.y - 18, text: `+${heal} HP`, color: '#fb7185', life: 0.6, vy: 20 });
      pickupFx(n, d.x, d.y, 'heal', d.value);
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
    if (distSq(e, n.player) < (e.r + PLAYER_RADIUS) * (e.r + PLAYER_RADIUS) && n.invuln <= 0) {
      let damage = e.damage;
      if (n.player.shield > 0) {
        const absorbed = Math.min(n.player.shield, damage);
        n.player.shield -= absorbed;
        damage -= absorbed;
      }
      n.player.hp -= damage;
      n.player.hitFlash = 1;
      n.invuln = 0.5;
      n.hitStop = Math.max(n.hitStop, 0.05);
      n.shake = Math.max(n.shake, 3);
      n.ripples.push(mkRipple(n.player.x, n.player.y, PLAYER_RADIUS + 14, '#fb7185', 0.3, 2.2));
      n.particles.push(...sparkBurst(n.player.x, n.player.y, '#fb7185', 6, 160));
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
