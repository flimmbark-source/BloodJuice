import { ARENA_HEIGHT, ARENA_WIDTH, DROP_RADIUS, PLAYER_RADIUS } from './constants';
import type { AreaZone, Enemy, ExplosionFx, Floater, GameState, Particle, Projectile, Ripple, SpawnWarning } from './types';
type RenderMode = 'desktop' | 'mobile';

export const drawCircle = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  fill: string | CanvasGradient | CanvasPattern | null,
  stroke?: string,
  width = 1,
): void => {
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.lineWidth = width;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
};

const DUST = Array.from({ length: 110 }, (_, i) => ({
  x: (i * 137.7) % ARENA_WIDTH,
  y: (i * 97.3) % ARENA_HEIGHT,
  s: i % 3 === 0 ? 2 : 1.2,
  hue: i % 5 === 0 ? 'rgba(167,139,250,.08)' : i % 2 === 0 ? 'rgba(255,255,255,.06)' : 'rgba(251,113,133,.06)',
  drift: (i % 7) * 0.2,
}));

const drawBackground = (ctx: CanvasRenderingContext2D, time: number, mode: RenderMode): void => {
  const bg = ctx.createLinearGradient(0, 0, 0, ARENA_HEIGHT);
  bg.addColorStop(0, '#0b1020');
  bg.addColorStop(0.6, '#10132a');
  bg.addColorStop(1, '#140b1d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

  if (mode === 'desktop') {
    ctx.strokeStyle = 'rgba(255,255,255,.05)';
    ctx.lineWidth = 1;
    for (let x = 40; x < ARENA_WIDTH; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, ARENA_HEIGHT);
      ctx.stroke();
    }
    for (let y = 40; y < ARENA_HEIGHT; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(ARENA_WIDTH, y);
      ctx.stroke();
    }
  }

  const dust = mode === 'mobile' ? DUST.slice(0, 36) : DUST;
  for (const d of dust) {
    const ox = (d.x + Math.sin(time * 0.4 + d.drift) * 12 + ARENA_WIDTH) % ARENA_WIDTH;
    const oy = (d.y + Math.cos(time * 0.3 + d.drift) * 8 + ARENA_HEIGHT) % ARENA_HEIGHT;
    ctx.fillStyle = d.hue;
    ctx.fillRect(ox, oy, d.s, d.s);
  }

  const fog = ctx.createRadialGradient(ARENA_WIDTH / 2, ARENA_HEIGHT / 2, 120, ARENA_WIDTH / 2, ARENA_HEIGHT / 2, 560);
  fog.addColorStop(0, 'rgba(167,139,250,0)');
  fog.addColorStop(1, 'rgba(15,23,42,.28)');
  ctx.fillStyle = fog;
  ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
};

const drawVignette = (ctx: CanvasRenderingContext2D, hitFlash: number): void => {
  const vg = ctx.createRadialGradient(ARENA_WIDTH / 2, ARENA_HEIGHT / 2, 260, ARENA_WIDTH / 2, ARENA_HEIGHT / 2, 560);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, `rgba(4,6,15,${0.45 + Math.min(0.25, hitFlash * 0.25)})`);
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
};

const drawAshZones = (ctx: CanvasRenderingContext2D, zones: AreaZone[], ashDuration: number): void => {
  for (const z of zones) {
    const t = z.life / Math.max(0.1, ashDuration || 1);
    const r = z.radius;
    const grad = ctx.createRadialGradient(z.x, z.y, r * 0.25, z.x, z.y, r);
    grad.addColorStop(0, `rgba(251,146,60,${0.22 * t})`);
    grad.addColorStop(1, 'rgba(251,146,60,0)');
    ctx.fillStyle = grad;
    drawCircle(ctx, z.x, z.y, r, grad);
    drawCircle(ctx, z.x, z.y, r, null, `rgba(251,191,36,${0.18 * t})`, 1);
  }
};

const drawTrailZones = (ctx: CanvasRenderingContext2D, zones: AreaZone[]): void => {
  for (const z of zones) {
    const grad = ctx.createRadialGradient(z.x, z.y, 2, z.x, z.y, z.radius);
    grad.addColorStop(0, `rgba(96,165,250,${0.22 * z.life})`);
    grad.addColorStop(1, 'rgba(96,165,250,0)');
    ctx.fillStyle = grad;
    drawCircle(ctx, z.x, z.y, z.radius, grad);
  }
};

const drawExplosions = (ctx: CanvasRenderingContext2D, exp: ExplosionFx[]): void => {
  for (const e of exp) {
    const k = Math.max(0, e.life / 0.22);
    drawCircle(ctx, e.x, e.y, e.r * (1 - k * 0.35), `rgba(251,191,36,${0.22 * k})`);
    drawCircle(ctx, e.x, e.y, e.r * 0.55, `rgba(255,245,180,${0.18 * k})`);
    drawCircle(ctx, e.x, e.y, e.r * (1 - k * 0.2), null, `rgba(253,224,71,${0.6 * k})`, 2);
  }
};

const drawSpawnWarnings = (ctx: CanvasRenderingContext2D, spawns: SpawnWarning[], time: number): void => {
  for (const s of spawns) {
    const t = s.life / s.maxLife;
    const pulse = 0.5 + 0.5 * Math.sin(time * 10 + s.x * 0.01);
    const imminence = 1 - t;
    const alpha = 0.35 + imminence * 0.55;
    const r = s.r * (1.15 - t * 0.3);
    drawCircle(ctx, s.x, s.y, r + 4, null, `rgba(248,113,133,${0.35 + imminence * 0.35})`, 1);
    drawCircle(ctx, s.x, s.y, r, `rgba(248,113,133,${0.1 + imminence * 0.18})`, `rgba(248,113,133,${alpha})`, 2);
    const cross = r * 0.55;
    ctx.strokeStyle = `rgba(255,200,200,${0.4 + imminence * 0.5})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(s.x - cross, s.y);
    ctx.lineTo(s.x + cross, s.y);
    ctx.moveTo(s.x, s.y - cross);
    ctx.lineTo(s.x, s.y + cross);
    ctx.stroke();
    drawCircle(ctx, s.x, s.y, 3 + pulse * 2.5 + imminence * 3, `rgba(254,202,202,${0.5 + imminence * 0.4})`);
  }
};

const drawDrops = (ctx: CanvasRenderingContext2D, state: GameState): void => {
  for (const d of state.drops) {
    const color = d.type === 'heal' ? '#fb7185' : d.value > 1 ? '#f59e0b' : '#34d399';
    const glow = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, DROP_RADIUS * 3);
    glow.addColorStop(0, `${color}55`);
    glow.addColorStop(1, `${color}00`);
    ctx.fillStyle = glow;
    drawCircle(ctx, d.x, d.y, DROP_RADIUS * 3, glow as unknown as string);
    drawCircle(ctx, d.x, d.y, DROP_RADIUS, color, 'rgba(255,255,255,.7)', 1.5);
  }
};

const drawProjectileTrail = (ctx: CanvasRenderingContext2D, p: Projectile): void => {
  const pts = p.trailPoints;
  if (!pts || pts.length < 2) return;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const t = i / pts.length;
    const alpha = Math.max(0, b.life / 0.22) * t;
    ctx.strokeStyle = p.color;
    ctx.globalAlpha = alpha * (p.style === 'needle' ? 0.85 : 0.55);
    ctx.lineWidth = p.size * (p.style === 'needle' ? 0.55 : p.style === 'bloom' ? 0.75 : 0.6) * t;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
};

const drawProjectile = (ctx: CanvasRenderingContext2D, p: Projectile): void => {
  drawProjectileTrail(ctx, p);
  if (p.style === 'needle') {
    const ang = Math.atan2(p.y - p.py, p.x - p.px);
    const len = 14;
    ctx.strokeStyle = p.color;
    ctx.lineCap = 'round';
    ctx.lineWidth = 2.2;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.moveTo(p.x - Math.cos(ang) * len, p.y - Math.sin(ang) * len);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ctx.globalAlpha = 1;
    drawCircle(ctx, p.x, p.y, p.size, '#fff');
    drawCircle(ctx, p.x, p.y, p.size + 1.5, null, p.color, 1.2);
  } else if (p.style === 'boomerang') {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.spin || 0);
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, p.size, Math.PI * 0.15, Math.PI * 1.15);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, p.size * 0.65, Math.PI * 0.18, Math.PI * 1.08);
    ctx.strokeStyle = 'rgba(255,255,255,.65)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(134,239,172,.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, p.size * 1.15, Math.PI * 0.1, Math.PI * 1.2);
    ctx.stroke();
    ctx.restore();
  } else if (p.style === 'bloom') {
    drawCircle(ctx, p.x, p.y, p.size + 4, `${p.color}33`);
    drawCircle(ctx, p.x, p.y, p.size + 2, `${p.color}55`);
    drawCircle(ctx, p.x, p.y, p.size, p.color);
    drawCircle(ctx, p.x, p.y, p.size * 0.45, '#fff8dc');
  } else {
    drawCircle(ctx, p.x, p.y, p.size + 2, `${p.color}33`);
    drawCircle(ctx, p.x, p.y, p.size, p.color);
    drawCircle(ctx, p.x, p.y, p.size * 0.5, '#ffffff');
  }
};

const drawSickleMark = (ctx: CanvasRenderingContext2D, e: Enemy, time: number): void => {
  const dotLife = (e.dotTime as number) || 0;
  if (!(dotLife > 0) || !((e.dotDps as number) > 0)) return;
  const pulse = 0.6 + 0.4 * Math.sin(time * 8 + e.phase);
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.rotate(e.phase);
  ctx.strokeStyle = `rgba(134,239,172,${0.65 * pulse + 0.25})`;
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  const L = e.r + 4;
  ctx.beginPath();
  ctx.moveTo(-L, -L * 0.2);
  ctx.lineTo(L, L * 0.2);
  ctx.moveTo(-L * 0.3, -L);
  ctx.lineTo(L * 0.3, L);
  ctx.stroke();
  ctx.strokeStyle = `rgba(187,247,208,${0.55 * pulse})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, e.r + 5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
};

const drawEnemy = (ctx: CanvasRenderingContext2D, e: Enemy, time: number): void => {
  const flash = Math.max(0, (e.hurtFlash as number) || 0);
  const body = flash > 0.05 ? 'rgba(255,255,255,.95)' : e.color;
  const shadow = ctx.createRadialGradient(e.x, e.y + 2, 0, e.x, e.y + 2, e.r * 1.8);
  shadow.addColorStop(0, 'rgba(0,0,0,.35)');
  shadow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = shadow;
  drawCircle(ctx, e.x, e.y + 2, e.r * 1.8, shadow);
  drawCircle(ctx, e.x, e.y, e.r, body, 'rgba(255,255,255,.55)', 1.5);

  if (e.moveType === 'scout') {
    ctx.strokeStyle = 'rgba(255,255,255,.65)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(e.x - 6, e.y);
    ctx.lineTo(e.x + 6, e.y);
    ctx.stroke();
    const dashT = (e.dashTime as number) || 0;
    if (dashT > 0) {
      const ang = (e.dashAngle as number) || 0;
      drawCircle(ctx, e.x, e.y, e.r + 7, null, 'rgba(250,204,21,.6)', 2);
      ctx.strokeStyle = 'rgba(250,204,21,.55)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(e.x - Math.cos(ang) * (e.r + 14), e.y - Math.sin(ang) * (e.r + 14));
      ctx.lineTo(e.x + Math.cos(ang) * (e.r + 4), e.y + Math.sin(ang) * (e.r + 4));
      ctx.stroke();
    }
  } else if (e.moveType === 'chaser') {
    const burstT = (e.burstTime as number) || 0;
    if (burstT > 0) {
      drawCircle(ctx, e.x, e.y, e.r + 6, null, 'rgba(248,113,133,.7)', 1.5);
      drawCircle(ctx, e.x, e.y, e.r + 9, null, 'rgba(248,113,133,.35)', 1);
    }
  } else if (e.moveType === 'tank') {
    const windup = (e.windup as number) || 0;
    const charge = (e.chargeTime as number) || 0;
    if (windup > 0) {
      const k = 1 - windup / 0.56;
      drawCircle(ctx, e.x, e.y, e.r + 4 + k * 6, null, `rgba(248,113,113,${0.55 + k * 0.35})`, 2 + k * 1.5);
      ctx.strokeStyle = `rgba(254,202,202,${0.3 + k * 0.4})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      const ang = Math.atan2(e.y - e.y, 1);
      ctx.arc(e.x, e.y, e.r + 10 + k * 5, ang - 0.6, ang + 0.6);
      ctx.stroke();
    }
    if (charge > 0) {
      const ang = (e.chargeAngle as number) || 0;
      drawCircle(ctx, e.x, e.y, e.r + 12, null, 'rgba(255,160,122,.55)', 2);
      ctx.strokeStyle = 'rgba(254,215,170,.55)';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(e.x, e.y);
      ctx.lineTo(e.x + Math.cos(ang) * (e.r + 22), e.y + Math.sin(ang) * (e.r + 22));
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(0,0,0,.2)';
    ctx.fillRect(e.x - 5, e.y - 2, 10, 4);
  } else if (e.moveType === 'orbit') {
    drawCircle(ctx, e.x, e.y, e.r + 4, null, 'rgba(196,181,253,.4)', 1);
    const ring = time * 2 + e.phase;
    for (let i = 0; i < 2; i++) {
      const a = ring + i * Math.PI;
      drawCircle(ctx, e.x + Math.cos(a) * (e.r + 6), e.y + Math.sin(a) * (e.r + 6), 1.4, 'rgba(196,181,253,.8)');
    }
    const feintT = (e.feintTime as number) || 0;
    if (feintT > 0) drawCircle(ctx, e.x, e.y, e.r + 9, null, 'rgba(255,255,255,.55)', 1.8);
  } else if (e.moveType === 'zigzag') {
    ctx.strokeStyle = 'rgba(255,255,255,.55)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(e.x - 5, e.y + 4);
    ctx.lineTo(e.x, e.y - 4);
    ctx.lineTo(e.x + 5, e.y + 4);
    ctx.stroke();
    if (Math.abs(Math.sin(time * 4.6 * ((e.drift as number) || 1) + e.phase)) > 0.82) {
      drawCircle(ctx, e.x, e.y, e.r + 5, null, 'rgba(34,211,238,.45)', 1);
    }
  }

  drawSickleMark(ctx, e, time);

  const hw = 24;
  const pct = Math.max(0, Math.min(1, e.hp / Math.max(0.0001, e.maxHp)));
  ctx.fillStyle = 'rgba(0,0,0,.4)';
  ctx.fillRect(e.x - hw / 2, e.y - e.r - 12, hw, 3);
  ctx.fillStyle = 'rgba(255,255,255,.85)';
  ctx.fillRect(e.x - hw / 2, e.y - e.r - 12, hw * pct, 3);

  if (flash > 0.05) {
    ctx.globalAlpha = Math.min(1, flash);
    drawCircle(ctx, e.x, e.y, e.r + 2, null, 'rgba(255,255,255,.9)', 2);
    ctx.globalAlpha = 1;
  }

  if (e.elite) drawCircle(ctx, e.x, e.y, e.r + 3, null, 'rgba(253,224,71,.75)', 1.5);
};

const drawParticles = (ctx: CanvasRenderingContext2D, arr: Particle[]): void => {
  for (const p of arr) {
    const a = Math.max(0, p.life / p.maxLife);
    ctx.globalAlpha = a;
    drawCircle(ctx, p.x, p.y, p.size * (0.6 + a * 0.4), p.color);
  }
  ctx.globalAlpha = 1;
};

const drawRipples = (ctx: CanvasRenderingContext2D, arr: Ripple[]): void => {
  for (const r of arr) {
    const a = Math.max(0, r.life / r.maxLife);
    ctx.globalAlpha = a;
    drawCircle(ctx, r.x, r.y, r.r, null, r.color, r.width);
  }
  ctx.globalAlpha = 1;
};

const drawFloaters = (ctx: CanvasRenderingContext2D, arr: Floater[]): void => {
  ctx.font = '600 12px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const f of arr) {
    const a = Math.max(0, f.life / 0.6);
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(0,0,0,.55)';
    ctx.fillText(f.text, f.x + 1, f.y + 1);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'start';
  ctx.textBaseline = 'alphabetic';
};

const drawPlayer = (ctx: CanvasRenderingContext2D, state: GameState): void => {
  const p = state.player;
  const aura = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, PLAYER_RADIUS * 2.4);
  aura.addColorStop(0, 'rgba(96,165,250,.28)');
  aura.addColorStop(1, 'rgba(96,165,250,0)');
  ctx.fillStyle = aura;
  drawCircle(ctx, p.x, p.y, PLAYER_RADIUS * 2.4, aura);

  if (p.shield > 0) drawCircle(ctx, p.x, p.y, PLAYER_RADIUS + 7, null, 'rgba(34,211,238,.7)', 2);
  if (p.momentumEnabled && p.momentumMeter >= 0.98) {
    drawCircle(ctx, p.x, p.y, PLAYER_RADIUS + 11, null, 'rgba(250,204,21,.95)', 2);
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 + state.time * 8;
      drawCircle(ctx, p.x + Math.cos(a) * (PLAYER_RADIUS + 11), p.y + Math.sin(a) * (PLAYER_RADIUS + 11), 2.5, 'rgba(250,204,21,.95)');
    }
  } else if (p.momentumEnabled && p.momentumMeter > 0.05) {
    ctx.strokeStyle = `rgba(250,204,21,${0.35 + p.momentumMeter * 0.4})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, PLAYER_RADIUS + 5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p.momentumMeter);
    ctx.stroke();
  }
  const flash = p.hitFlash;
  drawCircle(ctx, p.x, p.y, PLAYER_RADIUS, flash > 0 ? '#fb7185' : '#60a5fa', 'rgba(255,255,255,.8)', 3);
};

export const drawProjectileForTest = drawProjectile;
export const drawEnemyForTest = drawEnemy;

export const drawGame = (ctx: CanvasRenderingContext2D, game: GameState, mode: RenderMode = 'desktop'): void => {
  ctx.clearRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
  const shake = game.shake || 0;
  const shaken = shake > 0.05;
  if (shaken) {
    const ox = (Math.random() * 2 - 1) * shake;
    const oy = (Math.random() * 2 - 1) * shake;
    ctx.save();
    ctx.translate(ox, oy);
  }
  drawBackground(ctx, game.time, mode);
  drawAshZones(ctx, game.ash, game.systems.ashWakeDuration || 0.7);
  drawTrailZones(ctx, game.trail);
  drawExplosions(ctx, game.expl);
  drawSpawnWarnings(ctx, game.spawns, game.time);
  drawDrops(ctx, game);
  game.enemies.forEach((e) => drawEnemy(ctx, e, game.time));
  game.projectiles.forEach((p) => drawProjectile(ctx, p));
  drawParticles(ctx, game.particles);
  drawRipples(ctx, game.ripples);
  drawPlayer(ctx, game);
  drawFloaters(ctx, game.floaters);
  drawVignette(ctx, game.player.hitFlash);
  if (shaken) ctx.restore();
};
